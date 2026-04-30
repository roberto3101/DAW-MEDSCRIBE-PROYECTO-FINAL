# 04. Preguntas y respuestas para defender tu parte

> Estas son las preguntas que probablemente te haran. Memoriza la primera linea de cada respuesta.

---

## Bloque tecnico (FastAPI / Python)

### P1: ¿Por que usaron Python si todo el resto del proyecto es Java?

**R:** Porque **Python tiene el mejor ecosistema de inteligencia artificial**. Las librerias de OpenAI, Anthropic, librerias de procesamiento de audio, generacion de PDFs (ReportLab) y manipulacion de Word (python-docx) son maduras, gratuitas y ampliamente usadas en produccion. Implementar lo mismo en Java seria mas complicado y caro (algunas librerias requieren licencias). Ademas, separar en microservicios es una buena practica que permite usar el lenguaje optimo para cada responsabilidad.

### P2: ¿FastAPI es lento porque es Python?

**R:** **No.** FastAPI es uno de los frameworks web mas rapidos de Python, comparable a Node.js y Go en benchmarks. Soporta async/await nativo, lo que le permite manejar miles de conexiones concurrentes con poco overhead. Para nuestro caso de uso (transcribir audio y generar texto) la latencia esta dominada por las APIs externas de IA, no por el framework.

### P3: ¿Que es Pydantic y por que lo usan?

**R:** **Pydantic es la libreria estandar de validacion de datos en Python**, equivalente a Bean Validation en Java. La usamos para validar automaticamente las peticiones HTTP. Por ejemplo, la transcripcion debe tener al menos 10 caracteres y maximo 50,000. Si no cumple, FastAPI devuelve HTTP 422 con detalle del error sin que escribamos validacion manual.

### P4: ¿Como manejan asincronia en Python?

**R:** Con **async/await nativo**. Todas las llamadas a APIs externas usan `httpx.AsyncClient` o el SDK de OpenAI con `await`. Esto permite que mientras esperamos la respuesta de Groq o Mistral, FastAPI puede atender otras peticiones en la misma instancia.

---

## Bloque de IA (Whisper / LLM)

### P5: ¿Que es Whisper exactamente?

**R:** **Whisper es un modelo de inteligencia artificial creado por OpenAI** para convertir voz en texto. Es open source, soporta mas de 90 idiomas, funciona bien con audio ruidoso y tiene una precision del ~95% en espanol medico. Existen multiples proveedores que sirven Whisper como API (Groq, HuggingFace, Mistral con su variante Voxtral) lo que nos permite tener un cascade de fallbacks.

### P6: ¿Cual es la diferencia entre transcripcion y diarizacion?

**R:** **Transcripcion** es convertir voz en texto plano sin distinguir oradores. **Diarizacion** es identificar quien habla en cada momento, separando el audio en segmentos por orador (ej: "Medico", "Paciente"). En MedScribe ofrecemos ambos: si el medico activa el toggle "Separar voces", el sistema usa Pyannote (local) o Deepgram (cloud) para diarizar; si no, usa solo Whisper para transcribir.

### P7: ¿Que es un LLM y como decide la estructura del SOAP?

**R:** **LLM es Large Language Model**, una IA entrenada con millones de textos. En MedScribe usamos modelos como Llama 3.3, Mistral Small y otros. Le enviamos un "system prompt" que le explica que es un asistente medico, le damos contexto con guias clinicas en markdown (por especialidad), y le pasamos la transcripcion. El LLM organiza la informacion siguiendo el formato SOAP (Subjetivo, Objetivo, Analisis, Plan) que aprendio en su entrenamiento y refinamos con nuestras instrucciones.

### P8: ¿El LLM puede inventar datos? ¿Como evitan eso?

**R:** **Si, los LLMs pueden alucinar.** Para reducir el riesgo aplicamos varias tecnicas: (1) le damos contexto de la especialidad con guias clinicas reales, (2) en el system prompt le instruimos explicitamente "nunca inventes signos vitales no mencionados", (3) le pedimos que marque ambigüedades en una seccion "NOTAS DE VERIFICACION", (4) la nota generada queda en estado "Borrador" hasta que el medico la apruebe. La IA es una asistente, no un reemplazo del juicio medico.

### P9: ¿Por que NO entrenaron su propio modelo?

**R:** Entrenar un LLM desde cero requiere **millones de dolares** en computo y datos masivos. Hacer fine-tuning sobre un modelo existente requiere miles de ejemplos etiquetados y conocimiento avanzado de ML. En cambio, **usar prompting + RAG** (darle contexto via system prompt y guias) nos da el 80% del beneficio con el 1% del esfuerzo, y ademas podemos cambiar el modelo subyacente cuando salga uno mejor sin re-entrenar.

---

## Bloque de arquitectura

### P10: ¿Por que un cascade de 4-8 proveedores en lugar de uno solo?

**R:** **Por alta disponibilidad.** En produccion descubrimos que Groq, nuestro proveedor principal, bloquea ciertas IPs (incluso `console.groq.com` devuelve 403 desde Peru). Si dependieramos solo de Groq, el sistema estaria caido. El cascade intenta cada proveedor en orden hasta que uno responde correctamente; el usuario nunca se entera del fallo. Esto es un patron clasico de "circuit breaker" + "graceful degradation".

### P11: ¿Que pasa si TODOS los proveedores fallan?

**R:** El servicio devuelve HTTP 502 con un detalle que lista cada proveedor y su error. El frontend muestra una alerta clara al usuario explicando que la transcripcion no fue posible y le pide reintentar. En la practica, con 4 proveedores en cascade y otros 8 para LLM, la probabilidad de que TODOS fallen al mismo tiempo es practicamente nula.

### P12: ¿Como se comunica el servicio IA con el gateway Java?

**R:** **No se comunican directamente para el flujo principal.** El frontend Angular llama al servicio IA por su cuenta (`http://localhost:8000/api/ia/...`) y al gateway Java por su cuenta (`http://localhost:5000/api/...`). El gateway Java solo invoca al servicio IA en algunos casos especificos via `ClienteServicioIA.java` usando HttpClient. La separacion permite que cada servicio escale independientemente.

### P13: ¿Por que separan generacion de PDF y Word en un servicio Python?

**R:** Porque Python tiene **las mejores librerias** para esto: ReportLab y python-docx, ambas open source, gratuitas, robustas y con 10+ anos de produccion. En Java tendriamos que usar iText (que requiere licencia comercial para uso comercial) o Apache POI (mas complicado de configurar). Tambien aprovecho el mismo servicio que ya tiene los datos de la consulta y configuracion de la clinica.

---

## Bloque de seguridad y limites

### P14: ¿Como protegen el servicio IA de abuso?

**R:** El servicio IA es un microservicio interno; **no esta expuesto directamente a Internet en produccion**. Solo es accesible via el frontend (con CORS limitado a `localhost:3000`) o via el gateway Java (que valida JWT). En produccion real, lo desplegariamos detras del mismo gateway con autenticacion compartida.

### P15: ¿Que pasa con la privacidad del audio del paciente?

**R:** **Es una preocupacion legitima.** Pyannote corre 100% local, asi que con esa opcion el audio nunca sale del servidor. Con Deepgram el audio se envia a sus servidores en US bajo cumplimiento HIPAA. Para una version comercial real implementariamos: (1) opcion de auto-borrado del audio post-transcripcion, (2) firma de un BAA con el proveedor, (3) cifrado en transito con TLS y en reposo con AES-256.

### P16: ¿Cuanto cuesta procesar una consulta?

**R:** **Menos de $0.05 USD por consulta de 10 minutos** con Deepgram + Mistral. Mas precisamente: Deepgram cobra ~$0.043/minuto y Mistral cobra fracciones de centavo por nota generada. Con $200 de credito gratuito de Deepgram al registrarse podemos procesar mas de 4,000 consultas sin pagar nada. Para una clinica de 10 medicos, el costo mensual es de aproximadamente $30 USD.

---

## Bloque de pipeline

### P17: Si te pido que muestres el flujo completo del audio al PDF, ¿como lo explicas?

**R:** Es un pipeline de 4 etapas principales:

1. **Transcripcion**: el audio webm llega a `/api/ia/transcribir`, pasa por el cascade Whisper (Groq → HuggingFace → Mistral → Deepgram) hasta obtener texto.
2. **Procesamiento**: la transcripcion va a `/api/ia/procesar`, donde un clasificador detecta entidades, se carga contexto medico de la especialidad, y el cascade LLM genera la nota SOAP.
3. **Persistencia**: el frontend envia la nota al gateway Java, que la guarda en MySQL en estado "Borrador".
4. **Generacion de documento**: cuando el usuario lo solicita, `/api/ia/generar-pdf` construye el PDF con ReportLab incluyendo logo, datos del paciente, secciones SOAP y firma.

### P18: ¿Cuanto tiempo toma todo el pipeline?

**R:** **Entre 5 y 20 segundos** para una consulta tipica de 1-2 minutos de audio. La transcripcion toma 1-3 segundos, el LLM 3-15 segundos, y la generacion de PDF menos de 1 segundo. La parte mas lenta es el LLM porque depende del proveedor activo.

---

## Bloque "trampa" (preguntas dificiles)

### P19: ¿Llamarias a esto verdadera inteligencia artificial?

**R:** **Es IA, pero conviene matizar.** Whisper y los LLMs son modelos estadisticos muy sofisticados que aprenden patrones de millones de ejemplos. No "razonan" como un humano; predicen secuencias probables de texto. Por eso siempre dejamos al medico aprobar manualmente la nota antes de finalizarla. La IA es una herramienta de productividad, no un reemplazo del criterio profesional.

### P20: ¿Por que no usaron `procesar-async` con polling?

**R:** Originalmente lo intentamos, pero el endpoint `/api/ia/procesar-async` no estaba implementado en el servicio IA. Cuando descubrimos esto, cambiamos al endpoint sincrono `/api/ia/procesar` que **es suficientemente rapido** (3-15 seg) para no necesitar polling. Si en el futuro queremos manejar audios largos (>10 min), implementariamos cola con Celery + Redis para procesamiento async.

### P21: ¿Que pasaria si OpenAI prohibe el uso medico de sus modelos?

**R:** **No nos afectaria mucho.** Los modelos que usamos son open source (Llama, Mistral) y los servimos via proveedores alternativos (Groq, Mistral, HuggingFace, Deepgram, etc.). Incluso si todos los proveedores cloud nos cortaran, podriamos correr Llama 3.3 localmente con Ollama o vLLM. El cascade de 8 proveedores nos da resiliencia tecnica y comercial.

### P22: ¿Como verifican que la nota generada es correcta?

**R:** **No lo verificamos automaticamente — el medico es el responsable final.** La nota queda en estado "Borrador" hasta que el medico la revisa, edita si es necesario, y aprueba. Solo entonces pasa a estado "Aprobada". Esto es analogo a como un asistente humano podria escribir una nota que el medico revisa antes de firmar.

---

## Si no sabes una respuesta

**Estrategia:** "Buena pregunta. Esa logica especifica esta en el archivo `[mencionar archivo]`. La idea general es `[concepto general]`. Si quiere podemos abrirlo despues para verlo en detalle."

**Ejemplo:** "Buena pregunta. Esa logica especifica esta en `app/servicios/pipeline_nota_clinica.py`. La idea general es que el clasificador detecta la especialidad y carga el contexto correspondiente. Si quiere podemos abrirlo despues."

Esto demuestra que sabes donde buscar aunque no recuerdes el detalle exacto.
