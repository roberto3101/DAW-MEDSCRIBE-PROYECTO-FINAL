"""Transcripcion de audio con cascade de fallbacks.

Orden: Groq -> HuggingFace -> Mistral -> Deepgram (ultimo recurso).
Si alguno falla por red/key/cuota, intenta el siguiente automaticamente.
"""

import logging
import os
import tempfile

import httpx
import openai

TIEMPO_ESPERA_WHISPER_SEGUNDOS = 120
logger = logging.getLogger(__name__)


def _extraer_extension(nombre_archivo: str) -> str:
    return nombre_archivo.rsplit(".", 1)[-1] if "." in nombre_archivo else "wav"


async def _transcribir_con_openai_compat(
    contenido_audio: bytes,
    nombre_archivo: str,
    api_key: str,
    base_url: str,
    modelo: str,
) -> str:
    """Intenta transcribir usando un endpoint compatible con OpenAI (Groq, HF, Mistral)."""
    if not api_key:
        raise RuntimeError("API key vacia")

    extension = _extraer_extension(nombre_archivo)
    cliente = openai.OpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=httpx.Timeout(TIEMPO_ESPERA_WHISPER_SEGUNDOS),
    )

    with tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False) as tmp:
        tmp.write(contenido_audio)
        ruta_temporal = tmp.name

    try:
        with open(ruta_temporal, "rb") as archivo_audio:
            respuesta = cliente.audio.transcriptions.create(
                model=modelo,
                file=archivo_audio,
                language="es",
                response_format="text",
            )
        # Normalizar respuesta: algunos devuelven str, otros objeto, otros JSON con .text
        if isinstance(respuesta, str):
            texto = respuesta.strip()
            if texto.startswith("{"):
                try:
                    import json
                    datos = json.loads(texto)
                    # Respetar text/transcription vacios — gatillan fallback en el cascade
                    if "text" in datos:
                        return datos["text"] or ""
                    if "transcription" in datos:
                        return datos["transcription"] or ""
                    return texto
                except (json.JSONDecodeError, ValueError):
                    return texto
            return texto
        # Objeto con atributo .text
        if hasattr(respuesta, "text"):
            return respuesta.text or ""
        return str(respuesta)
    finally:
        try:
            os.unlink(ruta_temporal)
        except OSError:
            pass


async def _transcribir_con_deepgram(contenido_audio: bytes, nombre_archivo: str) -> str:
    """Ultimo recurso: Deepgram sin diarizacion (solo transcripcion)."""
    api_key = os.getenv("DEEPGRAM_API_KEY", "")
    if not api_key:
        raise RuntimeError("DEEPGRAM_API_KEY no configurada")

    extension = _extraer_extension(nombre_archivo)
    mime_types = {
        "webm": "audio/webm",
        "wav": "audio/wav",
        "mp3": "audio/mpeg",
        "m4a": "audio/mp4",
        "ogg": "audio/ogg",
    }
    tipo_mime = mime_types.get(extension, "audio/webm")

    parametros = {
        "model": "nova-3",
        "language": "es",
        "smart_format": "true",
        "punctuate": "true",
    }

    async with httpx.AsyncClient(timeout=TIEMPO_ESPERA_WHISPER_SEGUNDOS) as cliente:
        respuesta = await cliente.post(
            "https://api.deepgram.com/v1/listen",
            params=parametros,
            headers={
                "Authorization": f"Token {api_key}",
                "Content-Type": tipo_mime,
            },
            content=contenido_audio,
        )

    if respuesta.status_code != 200:
        raise RuntimeError(f"Deepgram respondio {respuesta.status_code}: {respuesta.text[:200]}")

    resultado = respuesta.json()
    alternativas = resultado.get("results", {}).get("channels", [{}])[0].get("alternatives", [{}])
    return alternativas[0].get("transcript", "") if alternativas else ""


def _proveedores_whisper():
    """Lista ordenada de proveedores Whisper (compatibles OpenAI) a intentar.

    Lee del .env. Si una variable esta vacia, ese proveedor se salta.
    """
    return [
        (
            "Groq",
            os.getenv("AI_API_KEY", ""),
            os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1"),
            "whisper-large-v3",
        ),
        (
            "HuggingFace",
            os.getenv("AI_EXTRA_5_API_KEY", ""),
            os.getenv("AI_EXTRA_5_BASE_URL", "https://router.huggingface.co/v1"),
            "openai/whisper-large-v3",
        ),
        (
            "Mistral",
            os.getenv("AI_EXTRA_2_API_KEY", ""),
            os.getenv("AI_EXTRA_2_BASE_URL", "https://api.mistral.ai/v1"),
            "voxtral-mini-latest",
        ),
    ]


async def transcribir_audio_con_whisper(contenido_audio: bytes, nombre_archivo: str) -> str:
    """Intenta transcribir con cada proveedor y cae a Deepgram como ultimo recurso."""
    errores: list[str] = []

    for nombre, api_key, base_url, modelo in _proveedores_whisper():
        if not api_key:
            errores.append(f"{nombre}: sin API key en .env")
            continue
        try:
            logger.info("[WHISPER] Intentando con %s (modelo=%s)", nombre, modelo)
            texto = await _transcribir_con_openai_compat(
                contenido_audio, nombre_archivo, api_key, base_url, modelo
            )
            if texto and texto.strip():
                logger.info("[WHISPER] %s OK (%d caracteres)", nombre, len(texto))
                return texto
            errores.append(f"{nombre}: respuesta vacia")
        except openai.APITimeoutError as error:
            errores.append(f"{nombre}: timeout")
            logger.warning("[WHISPER] %s timeout: %s", nombre, error)
        except Exception as error:  # pylint: disable=broad-except
            mensaje = str(error)[:200]
            errores.append(f"{nombre}: {mensaje}")
            logger.warning("[WHISPER] %s fallo: %s", nombre, mensaje)

    # Ultimo recurso: Deepgram sin diarizacion
    try:
        logger.info("[WHISPER] Intentando con Deepgram (ultimo recurso)")
        texto = await _transcribir_con_deepgram(contenido_audio, nombre_archivo)
        if texto and texto.strip():
            logger.info("[WHISPER] Deepgram OK (%d caracteres)", len(texto))
            return texto
        errores.append("Deepgram: respuesta vacia")
    except Exception as error:  # pylint: disable=broad-except
        errores.append(f"Deepgram: {str(error)[:200]}")
        logger.warning("[WHISPER] Deepgram fallo: %s", str(error)[:200])

    from fastapi import HTTPException

    raise HTTPException(
        status_code=502,
        detail="Todos los proveedores de transcripcion fallaron: " + " | ".join(errores),
    )
