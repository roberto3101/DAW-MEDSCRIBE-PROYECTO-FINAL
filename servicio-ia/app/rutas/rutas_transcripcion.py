import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from app.servicios.servicio_whisper import transcribir_audio_con_whisper
from app.servicios.diarizador_deepgram import transcribir_y_diarizar_con_deepgram
from app.validadores.validador_audio import validar_archivo_de_audio_completo

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/transcribir")
async def transcribir_archivo_de_audio(
    archivo: UploadFile = File(...),
    diarizar: bool = Query(default=False),
    motor_diarizacion: str = Query(default="deepgram", regex="^(deepgram)$"),
):
    contenido = await archivo.read()
    validar_archivo_de_audio_completo(contenido, archivo.filename)
    extension = archivo.filename.rsplit(".", 1)[-1] if "." in archivo.filename else "webm"

    if not diarizar:
        try:
            resultado = await transcribir_audio_con_whisper(contenido, archivo.filename)
            return {"transcripcion": resultado}
        except HTTPException:
            raise
        except Exception as error:
            raise HTTPException(status_code=500, detail=f"Error al transcribir: {str(error)}")

    try:
        return await transcribir_y_diarizar_con_deepgram(contenido, extension)
    except Exception as error:
        logger.warning("[DIAR] Deepgram fallo: %s", str(error)[:200])
        raise HTTPException(status_code=500, detail=f"Error en Deepgram: {str(error)}")
