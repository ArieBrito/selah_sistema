@AGENTS.md

## 1. Piensa antes de programar

No des nada por sentado. No ocultes la incertidumbre. Haz explícitos los compromisos (tradeoffs).

Antes de implementar:

* Expón tus supuestos de forma explícita. Si tienes dudas, pregunta.
* Si existen varias interpretaciones posibles, preséntalas; no elijas una en silencio.
* Si existe un enfoque más simple, dilo. Cuestiona la propuesta cuando sea apropiado.
* Si algo no está claro, detente. Explica qué es lo que resulta confuso y pregunta.

## 2. La simplicidad primero

Escribe la mínima cantidad de código necesaria para resolver el problema. Nada especulativo.

* No agregues funcionalidades que no se hayan solicitado.
* No crees abstracciones para código de un solo uso.
* No añadas "flexibilidad" o "configurabilidad" que no se haya pedido.
* No implementes manejo de errores para escenarios imposibles.
* Si escribiste 200 líneas y podría resolverse con 50, reescríbelo.
* Pregúntate: **"¿Un ingeniero senior diría que esto está innecesariamente complicado?"** Si la respuesta es sí, simplifícalo.

## 3. Haz cambios quirúrgicos

Modifica únicamente lo necesario. Limpia solo el desorden que tú mismo generes.

Al editar código existente:

* No "mejores" código, comentarios o formato que estén alrededor de tu cambio.
* No refactorices partes que no están rotas.
* Mantén el estilo existente, aunque tú lo harías de otra manera.
* Si detectas código muerto que no está relacionado, menciónalo, pero no lo elimines.

Cuando tus cambios generen elementos huérfanos:

* Elimina las importaciones, variables o funciones que **tus propios cambios** hayan dejado sin uso.
* No elimines código muerto que ya existía, salvo que se te solicite.

La prueba es simple: **cada línea modificada debe poder relacionarse directamente con la solicitud del usuario.**

## 4. Ejecución orientada a objetivos

Define criterios de éxito. Repite el ciclo hasta verificar que se cumplan.

Convierte las tareas en objetivos verificables:

* **"Agregar validación"** → "Escribir pruebas para entradas inválidas y hacer que pasen."
* **"Corregir el error"** → "Escribir una prueba que reproduzca el error y luego hacer que pase."
* **"Refactorizar X"** → "Asegurar que todas las pruebas pasen antes y después del cambio."

Para tareas de varios pasos, presenta un plan breve:

1. **[Paso]** → verificar: **[comprobación]**
2. **[Paso]** → verificar: **[comprobación]**
3. **[Paso]** → verificar: **[comprobación]**

Los criterios de éxito sólidos te permiten avanzar y verificar de forma autónoma. Los criterios débiles (por ejemplo, **"hacer que funcione"**) obligan a pedir aclaraciones constantemente.

### Estas directrices están funcionando si se observa:

* Menos cambios innecesarios en las diferencias (diffs).
* Menos reescrituras causadas por soluciones excesivamente complejas.
* Las preguntas de aclaración aparecen **antes** de implementar, en lugar de hacerlo **después** de cometer errores.

### Descripción de la marca

# Selah
## Esencia del nombre
**Selah** es un término de origen hebreo que aparece en los Salmos y suele interpretarse como una invitación a **hacer una pausa y contemplar**. En la marca, esa idea funciona como inspiración estética y emocional: piezas que transmiten **serenidad, delicadeza y calidez**, pensadas para acompañar y realzar el estilo de quien las usa.

## Qué es Selah
Selah es una marca **artesanal de joyería y accesorios de moda**, elaborada con **piedras naturales semipreciosas**. El enfoque es el **estilo y la estética**: piezas bonitas, delicadas y versátiles, hechas a mano y con materiales nobles, para verse y sentirse bien en el día a día.

## Productos
- **Pulseras de cuentas** (elásticas, ligeras, ideales para el día a día y para apilar/combinar).
- **Aretes minimalistas** (perla y piedras pequeñas).
- **Anillos de cuentas**.

## Materiales
Piedras **naturales semipreciosas**, combinadas con detalles metálicos. El valor está en lo hecho a mano, la calidad del material y el cuidado del diseño.

## Canal de venta
Venta **presencial / en persona** (por confirmar puntos de venta exactos).

## Público objetivo
Mujeres jóvenes-adultas (aprox. 18–40 años) que buscan accesorios **delicados, naturales y con estilo**, para complementar su outfit y combinar entre piezas; valoran lo hecho a mano y los materiales auténticos.

## Personalidad y valores de marca
Estilo · feminidad · calidez · naturalidad · hecho a mano · calidad · cercanía. La comunicación es suave, alegre y acogedora, centrada en el diseño y la belleza de cada pieza.

## Identidad visual
- **Paleta:** pasteles cálidos — verde salvia, mostaza/dorado, crema, naranja y salmón/rosa.
- **Elementos gráficos:** margaritas y una línea ondulada.
- **Tono de comunicación:** cálido, cercano, positivo y relajado.

## Propósito *(borrador)*
Ofrecer joyería artesanal con piedras naturales que combine estilo, delicadeza y calidad, para que cada persona encuentre piezas que realcen su look y la acompañen todos los días.