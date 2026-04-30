# 05. Guion de presentacion — Jose Roberto La Rosa

> Tu parte: **5 minutos** dentro de los 20 totales del equipo. Hablas en la seccion del informe HTML correspondiente al **servicio IA**.

---

## CONTEXTO IMPORTANTE

- Estas presentando con **el HTML abierto** (`Documentos/Web/informe-medscribe-daw.html`).
- Cuando Brayan termina su seccion (base de datos), avanza con `→` y entras tu.
- Tu turno empieza aproximadamente en el minuto **15:00** y termina en el **20:00**.

---

## ANTES DE EMPEZAR — Lista de verificacion

- [ ] Brayan esta presentando — espera tu turno.
- [ ] Tienes Swagger abierto en una pestana separada (`http://localhost:8000/docs`).
- [ ] Tienes el frontend abierto en otra pestana (`http://localhost:3000/consultas/nueva`).
- [ ] Sabes en que momento toca tu seccion (cuando Brayan avance).
- [ ] Tienes audio de prueba grabado o un guion de demo memorizado.
- [ ] Probaste que el cascade IA funciona (ej: `curl /api/ia/transcribir` con un WAV de prueba).

---

## SECCION A — INTRODUCCION DEL SERVICIO IA (1:00)

**En pantalla:** Seccion del HTML "Servicio de Inteligencia Artificial".

**Lo que dices:**
> "Buenas tardes profesor. Mi nombre es **Jose Roberto La Rosa Ledezma**, codigo i202333980, soy el coordinador del equipo. Yo me encargue del **servicio de inteligencia artificial en Python con FastAPI**, que es el cerebro del sistema MedScribe.
>
> Mi parte resuelve el problema central del proyecto: **convertir un audio crudo del medico en una nota clinica estructurada** en menos de 30 segundos. Para esto integre cuatro proveedores de transcripcion (Groq, HuggingFace, Mistral y Deepgram) y ocho proveedores de modelos de lenguaje, en un patron de **cascade con fallback automatico**.
>
> El servicio esta construido con FastAPI, que es el framework Python equivalente a Spring Boot pero mas ligero. Se ejecuta en Docker en el puerto 8000 y expone documentacion automatica via Swagger en `/docs`."

→ **Avanza con `→`**

---

## SECCION B — PIPELINE DE IA: ARQUITECTURA (1:30)

**En pantalla:** Diagrama de arquitectura o secuencia de transcripcion.

**Lo que dices:**
> "Aqui pueden ver el pipeline completo. Cuando el medico termina de grabar, el frontend Angular envia el audio a mi endpoint `/api/ia/transcribir`. Internamente, ese endpoint ejecuta un **cascade de cuatro proveedores Whisper**: intenta con Groq primero porque es el mas rapido, si falla cae a HuggingFace, despues a Mistral, y como ultimo recurso a Deepgram.
>
> Esto es importante porque en nuestras pruebas reales descubrimos que **Groq bloquea ciertas IPs** desde Peru — incluso `console.groq.com` devuelve 403. Sin el cascade, el sistema estaria caido. Con el cascade, **el usuario ni se entera**: el sistema simplemente usa el siguiente proveedor.
>
> Una vez obtenida la transcripcion, paso al segundo endpoint: `/api/ia/procesar`. Aqui el flujo es: clasifico la intencion del texto, cargo el contexto medico de la especialidad seleccionada (ej: medicina general, pediatria, cardiologia), y le envio todo a un **segundo cascade de ocho LLMs**, comenzando por Llama 3.3 en Groq y cayendo en orden hasta GitHub Models si fuera necesario."

→ **Avanza con `→`**

---

## SECCION C — DEMO EN VIVO (2:00)

**En pantalla:** Cambia a `http://localhost:3000/consultas/nueva`.

**Lo que haces:**
1. Selecciona un paciente desde el buscador.
2. Activa el toggle "Separar voces (diarizacion)" y selecciona Deepgram.
3. Presiona el microfono y graba un dialogo corto (ej: 30 segundos del guion medico-paciente que ya tienen).
4. Presiona stop, luego "Procesar con IA".
5. Mientras procesa, mientras tanto sigue hablando.

**Lo que dices mientras grabas:**
> "Voy a simular ahora una consulta. Selecciono el paciente, activo la diarizacion con Deepgram para que separe las voces medico-paciente, y grabo un dialogo breve."

**Mientras procesa:**
> "Mientras procesa, vean lo que esta pasando: el frontend ya envio el audio al servicio Python, este intenta el cascade Whisper, **Groq fallara con 403** porque la red lo bloquea, **HuggingFace tambien fallara**, y finalmente **Mistral Voxtral** respondera con la transcripcion. Despues otro cascade LLM generara la nota SOAP completa."

**Cuando aparezca el resultado:**
> "Aqui tenemos el resultado: en el panel izquierdo la transcripcion, con badges que indican que se uso Deepgram con un hablante detectado y la cantidad de segmentos. En el panel derecho, la nota SOAP estructurada con secciones Subjetivo, Objetivo, Analisis y Plan, incluyendo codigos CIE-10."

**Si tienes tiempo:** muestra los logs.
```cmd
docker logs medscribe-servicio-ia --tail 20
```

> "En los logs pueden ver al cascade en accion: `[WHISPER] Groq fallo: 403`, `[WHISPER] HuggingFace fallo: Not Found`, `[WHISPER] Mistral OK (175 caracteres)`, y luego `[LLM] Mistral OK (1842 caracteres)`."

→ **Avanza con `→`**

---

## SECCION D — GENERACION DE DOCUMENTOS (0:30)

**En pantalla:** Vuelve al HTML, seccion de generacion de documentos.

**Lo que dices:**
> "Una vez aprobada la nota, el medico puede descargarla como PDF o Word. Esto lo genero tambien desde Python usando **ReportLab para PDFs** y **python-docx para Word**, dos librerias maduras y gratuitas. El medico tiene **cuatro formatos** disponibles configurables desde la pagina de configuracion: Clasico MINSA, Moderno Medico, Clinico Elegante y Compacto Funcional. El logo de la clinica y la firma digital del medico se incluyen automaticamente si fueron configurados."

→ **Avanza con `→`** (pasa a la conclusion del equipo)

---

## TIEMPO TOTAL: 5:00

---

## SI EL TIEMPO TE QUEDA CORTO (3 min)

Salta la seccion D (PDF/Word) y enfocate en:
- **Seccion A:** introduccion (1 min)
- **Seccion C:** demo en vivo abreviada (2 min)

Lo importante es que se vea funcionar el cascade en la demo.

---

## SI TE INTERRUMPEN CON UNA PREGUNTA

**Estrategia general:** responde en 2-3 frases y vuelve al guion.

**Si no sabes la respuesta:**
> "Buena pregunta. Esa logica especifica esta en el archivo `[X]`. La idea general es `[concepto]`. Si quiere podemos abrirlo despues."

**Preguntas mas probables:**

- "¿Por que Python y no Java para esto?" → ver pregunta P1 del archivo 04.
- "¿Que pasa si la IA inventa cosas?" → "Por eso la nota queda en Borrador hasta que el medico la apruebe."
- "¿Cuanto cuesta esto?" → "Menos de $0.05 USD por consulta de 10 minutos."
- "¿Es seguro enviar audio a la nube?" → "Pyannote corre 100% local; con Deepgram cumplimos HIPAA."

---

## TIPS

- **Habla con conviccion**. Esta es la parte mas tecnica y diferenciadora del proyecto.
- **No te disculpes** por los detalles. El profe espera que sepas.
- **Cuando muestres la demo**, no te quedes callado mientras procesa: explica el cascade en tiempo real.
- **Si la demo falla en vivo**, no panic: di "veamos los logs" y muestra que el cascade detecta el error y reintenta.
- **Pasa la palabra al cierre con energia**: "...y con esto cierro mi parte, pasamos a las conclusiones del equipo."

---

## PALABRAS CLAVE A INCLUIR EN TU EXPOSICION

Memoriza estas palabras y usalas. Demuestran dominio:

- FastAPI
- Cascade de proveedores / fallback automatico
- Whisper (Groq, HuggingFace, Mistral, Deepgram)
- LLM (Llama 3.3, Mistral)
- Diarizacion
- Pyannote vs Deepgram
- ReportLab + python-docx
- Pipeline asincrono
- High availability / disponibilidad
- CIE-10
- SOAP

Si las dices con naturalidad, el profesor sabra que dominas tu parte.

---

## DESPUES DE PRESENTAR

- Felicita a tus companeros.
- Preparate para preguntas finales del jurado (5-10 min adicionales).
- Si te preguntan algo de otra parte, **redirige amablemente**: "Esa parte la hizo Cesar/Brayan/Antony, ¿le pediria a el que responda?".
