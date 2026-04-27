import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from app.servicios.servicio_whisper import transcribir_audio_con_whisper
from app.validadores.validador_audio import validar_archivo_de_audio_completo

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/transcribir")
async def transcribir_archivo_de_audio(
    archivo: UploadFile = File(...),
    diarizar: bool = Query(default=False),
    motor_diarizacion: str = Query(default="pyannote", regex="^(pyannote|deepgram)$"),
):
    contenido = await archivo.read()
    validar_archivo_de_audio_completo(contenido, archivo.filename)
    extension = archivo.filename.rsplit(".", 1)[-1] if "." in archivo.filename else "webm"

    if not diarizar:
        # Sin diarizacion: cascade Whisper -> Deepgram (ya gestionado en servicio_whisper)
        try:
            resultado = await transcribir_audio_con_whisper(contenido, archivo.filename)
            return {"transcripcion": resultado}
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Error al transcribir: {str(error)}")

    # Diarizacion solicitada
    if motor_diarizacion == "deepgram":
        try:
            from app.servicios.diarizador_deepgram import transcribir_y_diarizar_con_deepgram
            return await transcribir_y_diarizar_con_deepgram(contenido, extension)
        except Exception as error:
            logger.warning("[DIAR] Deepgram fallo: %s", str(error)[:200])
            raise HTTPException(status_code=500, detail=f"Error en Deepgram: {str(error)}")

    # motor_diarizacion == "pyannote": intentar Pyannote, y si falla (numpy/torch/etc) caer a Deepgram
    try:
        from app.servicios.diarizador_voces import transcribir_y_diarizar_con_pyannote
        return await transcribir_y_diarizar_con_pyannote(contenido, extension)
    except Exception as error:
        logger.warning("[DIAR] Pyannote fallo (%s), cayendo a Deepgram", str(error)[:150])
        try:
            from app.servicios.diarizador_deepgram import transcribir_y_diarizar_con_deepgram
            resultado = await transcribir_y_diarizar_con_deepgram(contenido, extension)
            # Marcar que se uso Deepgram aunque el usuario pidio Pyannote
            if isinstance(resultado, dict) and "diarizacion" in resultado and isinstance(resultado["diarizacion"], dict):
                resultado["diarizacion"]["motor_original_solicitado"] = "pyannote"
                resultado["diarizacion"]["motor_usado"] = "deepgram (fallback)"
            return resultado
        except Exception as error_fallback:
            raise HTTPException(
                status_code=500,
                detail=f"Pyannote no disponible ({str(error)[:100]}) y Deepgram fallback fallo: {str(error_fallback)[:150]}",
            )
