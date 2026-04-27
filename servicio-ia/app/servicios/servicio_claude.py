"""Generacion de nota clinica con LLM - cascade de fallbacks.

Orden: Groq -> SambaNova -> Cerebras -> NVIDIA -> HuggingFace -> Mistral -> LLM7 -> GitHub.
Si un proveedor falla (403, 502, timeout, cuota), intenta el siguiente automaticamente.
"""

import logging
import os

import httpx
import openai

TIEMPO_ESPERA_LLM_SEGUNDOS = 120
logger = logging.getLogger(__name__)


def _construir_mensaje_sistema_para_nota_clinica(contexto: str, clasificacion: dict, tipo_documento: str) -> str:
    return f"""Eres un asistente medico especializado en documentacion clinica en Peru.
Tu tarea es estructurar la siguiente transcripcion medica en un documento clinico profesional.

CONTEXTO RELEVANTE:
{contexto}

CLASIFICACION DETECTADA:
- Especialidad: {clasificacion['especialidad']}
- Tipo de documento: {tipo_documento}
- Entidades detectadas: {clasificacion['entidades']}

INSTRUCCIONES:
- Genera el documento en formato {tipo_documento}
- Usa terminologia medica profesional en espanol
- Elimina muletillas y lenguaje coloquial
- Si hay ambiguedades, indicalas al final como "NOTAS DE VERIFICACION"
- Incluye codigos CIE-10 cuando sea posible
"""


def _proveedores_llm():
    """Lista ordenada de proveedores LLM compatibles OpenAI.

    Cada tupla: (nombre, api_key, base_url, modelo).
    Proveedor sin api_key se salta automaticamente.
    """
    return [
        (
            "Groq",
            os.getenv("AI_API_KEY", ""),
            os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1"),
            os.getenv("AI_MODEL", "llama-3.3-70b-versatile"),
        ),
        (
            "SambaNova",
            os.getenv("AI_FALLBACK_API_KEY", ""),
            os.getenv("AI_FALLBACK_BASE_URL", "https://api.sambanova.ai/v1"),
            os.getenv("AI_FALLBACK_MODEL", "Meta-Llama-3.3-70B-Instruct"),
        ),
        (
            "Cerebras",
            os.getenv("AI_EXTRA_1_API_KEY", ""),
            os.getenv("AI_EXTRA_1_BASE_URL", "https://api.cerebras.ai/v1"),
            os.getenv("AI_EXTRA_1_MODEL", "llama3.1-8b"),
        ),
        (
            "NVIDIA",
            os.getenv("AI_EXTRA_4_API_KEY", ""),
            os.getenv("AI_EXTRA_4_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            os.getenv("AI_EXTRA_4_MODEL", "meta/llama-4-maverick-17b-128e-instruct"),
        ),
        (
            "HuggingFace",
            os.getenv("AI_EXTRA_5_API_KEY", ""),
            os.getenv("AI_EXTRA_5_BASE_URL", "https://router.huggingface.co/v1"),
            os.getenv("AI_EXTRA_5_MODEL", "meta-llama/Llama-3.3-70B-Instruct"),
        ),
        (
            "Mistral",
            os.getenv("AI_EXTRA_2_API_KEY", ""),
            os.getenv("AI_EXTRA_2_BASE_URL", "https://api.mistral.ai/v1"),
            os.getenv("AI_EXTRA_2_MODEL", "mistral-small-latest"),
        ),
        (
            "LLM7",
            os.getenv("AI_EXTRA_6_API_KEY", ""),
            os.getenv("AI_EXTRA_6_BASE_URL", "https://api.llm7.io/v1"),
            os.getenv("AI_EXTRA_6_MODEL", "meta-llama/Llama-3.3-70B-Instruct"),
        ),
        (
            "GitHub",
            os.getenv("AI_EXTRA_7_API_KEY", ""),
            os.getenv("AI_EXTRA_7_BASE_URL", "https://models.inference.ai.azure.com"),
            os.getenv("AI_EXTRA_7_MODEL", "gpt-4o-mini"),
        ),
    ]


async def _generar_con_proveedor(
    nombre: str,
    api_key: str,
    base_url: str,
    modelo: str,
    mensaje_sistema: str,
    transcripcion: str,
) -> str:
    """Intenta generar la nota con un proveedor LLM especifico."""
    if not api_key:
        raise RuntimeError("API key vacia")

    cliente = openai.OpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=httpx.Timeout(TIEMPO_ESPERA_LLM_SEGUNDOS),
    )

    respuesta = cliente.chat.completions.create(
        model=modelo,
        max_tokens=4096,
        messages=[
            {"role": "system", "content": mensaje_sistema},
            {"role": "user", "content": f"Transcripcion de la consulta medica:\n\n{transcripcion}"},
        ],
    )

    contenido = respuesta.choices[0].message.content
    if not contenido or not contenido.strip():
        raise RuntimeError("respuesta vacia")
    return contenido


async def generar_nota_clinica_con_claude(
    transcripcion: str,
    contexto: str,
    tipo_documento: str,
    clasificacion: dict,
) -> str:
    """Genera la nota clinica intentando cada proveedor en cascade."""
    mensaje_sistema = _construir_mensaje_sistema_para_nota_clinica(
        contexto, clasificacion, tipo_documento
    )

    errores: list[str] = []
    for nombre, api_key, base_url, modelo in _proveedores_llm():
        if not api_key:
            errores.append(f"{nombre}: sin API key")
            continue
        try:
            logger.info("[LLM] Intentando con %s (modelo=%s)", nombre, modelo)
            contenido = await _generar_con_proveedor(
                nombre, api_key, base_url, modelo, mensaje_sistema, transcripcion
            )
            logger.info("[LLM] %s OK (%d caracteres)", nombre, len(contenido))
            return contenido
        except openai.APITimeoutError:
            errores.append(f"{nombre}: timeout")
            logger.warning("[LLM] %s timeout", nombre)
        except Exception as error:  # pylint: disable=broad-except
            mensaje = str(error)[:200]
            errores.append(f"{nombre}: {mensaje}")
            logger.warning("[LLM] %s fallo: %s", nombre, mensaje)

    from fastapi import HTTPException

    raise HTTPException(
        status_code=502,
        detail="Todos los proveedores LLM fallaron: " + " | ".join(errores),
    )
