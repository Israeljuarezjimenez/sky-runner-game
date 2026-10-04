# Sky Runner

Este proyecto es un juego web arcade desarrollado con Flask, HTML, CSS y JavaScript. El objetivo es recoger estrellas, evitar asteroides y mantener la puntuación más alta posible.

## Capturas o descripción

- Interfaz tipo arcade moderna
- Diseño adaptable para escritorio, tablet y móvil
- Controles con teclado y botones táctiles
- Sistema de puntuación y mejor puntuación guardada en el navegador
- Redirección automática a la pantalla del juego

## Tecnologías utilizadas

- Python 3.12+
- Flask 3.0.3
- HTML5
- CSS3
- JavaScript

## Requisitos

- Python 3.12 o superior
- pip

## Instalación

```bash
cd sky-runner-game
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Ejecución

```bash
cd sky-runner-game
source .venv/bin/activate
PORT=5001 python3 app.py
```

Luego abre en el navegador:

```text
http://127.0.0.1:5001
```

## Estructura del proyecto

```text
sky-runner-game/
├── app.py
├── requirements.txt
├── .gitignore
├── README.md
├── data/
│   └── tasks.json
├── static/
│   ├── game.css
│   ├── game.js
│   └── styles.css
├── templates/
│   ├── game.html
│   └── index.html
└── .venv/
```

## Cómo jugar

- Usa las flechas o WASD para mover al jugador
- Recoge estrellas para sumar puntos
- Evita los asteroides
- Presiona la barra espaciadora para iniciar o reiniciar la partida
- En móvil puedes usar los botones táctiles

## Licencia

Este proyecto se distribuye con fines educativos y de portafolio personal.

## GitHub

Puedes inicializar un repositorio con:

```bash
git init
git add .
git commit -m "Primer commit: Sky Runner"
git branch -M main
```

Y luego conectarlo a tu remoto en GitHub:

```bash
git remote add origin https://github.com/tu-usuario/sky-runner.git
git push -u origin main
```
