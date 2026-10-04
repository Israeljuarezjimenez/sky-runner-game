from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from datetime import datetime

from flask import Flask, jsonify, redirect, render_template, request, url_for

app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DATA_FILE = os.path.join(DATA_DIR, "tasks.json")

DEFAULT_TASKS = [
    {
        "id": 1,
        "title": "Revisar objetivos del sprint",
        "description": "Confirmar entregables y priorizar tareas críticas del proyecto.",
        "priority": "alta",
        "completed": False,
        "created_at": "2026-10-04T09:00:00",
    },
    {
        "id": 2,
        "title": "Preparar presentación final",
        "description": "Actualizar slides con métricas, avances y próximos pasos.",
        "priority": "media",
        "completed": True,
        "created_at": "2026-10-04T10:30:00",
    },
    {
        "id": 3,
        "title": "Validar pruebas del sistema",
        "description": "Comprobar que el despliegue final funciona correctamente.",
        "priority": "baja",
        "completed": False,
        "created_at": "2026-10-04T11:15:00",
    },
]


def ensure_data_file() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, "w", encoding="utf-8") as file:
            json.dump(DEFAULT_TASKS, file, ensure_ascii=False, indent=2)


def load_tasks() -> list[dict]:
    ensure_data_file()
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def save_tasks(tasks: list[dict]) -> None:
    ensure_data_file()
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(tasks, file, ensure_ascii=False, indent=2)


def next_id(tasks: list[dict]) -> int:
    return max((task.get("id", 0) for task in tasks), default=0) + 1


def build_summary(tasks: list[dict]) -> dict:
    total = len(tasks)
    completed = sum(1 for task in tasks if task.get("completed"))
    pending = total - completed
    urgent = sum(1 for task in tasks if task.get("priority") == "alta" and not task.get("completed"))
    progress = round((completed / total) * 100) if total else 0

    return {
        "total": total,
        "completed": completed,
        "pending": pending,
        "urgent": urgent,
        "progress": progress,
    }


def filter_tasks(tasks: list[dict], active_filter: str, query: str) -> list[dict]:
    query_value = (query or "").strip().lower()
    filtered = []

    for task in tasks:
        title = str(task.get("title", "")).lower()
        description = str(task.get("description", "")).lower()
        category = str(task.get("category", "General")).lower()
        matches_query = not query_value or query_value in title or query_value in description or query_value in category

        if not matches_query:
            continue

        if active_filter == "pending":
            if task.get("completed"):
                continue
        elif active_filter == "completed":
            if not task.get("completed"):
                continue
        elif active_filter == "priority":
            if task.get("priority") != "alta":
                continue

        filtered.append(task)

    return filtered


def format_due_date(value: str | None) -> str:
    if not value:
        return "Sin fecha"
    try:
        return datetime.strptime(value, "%Y-%m-%d").strftime("%d/%m/%Y")
    except ValueError:
        return value


def fallback_ai_reply(message: str, tasks: list[dict] | None = None) -> str:
    text = message.lower()
    task_list = tasks or []
    task_summary = build_summary(task_list)

    if "hola" in text or "buenas" in text or "saludos" in text:
        return "¡Hola! Estoy listo para ayudarte con tus tareas, priorizar trabajo y resumir el progreso del proyecto."

    if any(word in text for word in ["pendiente", "pendientes", "faltan", "que tengo", "me falta", "qué tengo"]):
        pending = [task for task in task_list if not task.get("completed", False)]
        if not pending:
            return "No tienes tareas pendientes. Todo está actualizado y listo para cerrar."
        items = [
            f"{task.get('title', 'Tarea')} ({task.get('priority', 'media')})"
            for task in pending[:3]
        ]
        extra = "" if len(pending) <= 3 else f" y {len(pending) - 3} más"
        return f"Tienes {len(pending)} tareas pendientes: {', '.join(items)}{extra}. La prioridad más alta está en las tareas urgentes."

    if any(word in text for word in ["prioridad", "urgente", "importante"]):
        urgent = [task for task in task_list if task.get("priority") == "alta" and not task.get("completed", False)]
        if not urgent:
            return "No hay tareas urgentes en este momento. Puedes revisar las de prioridad media y planificar el siguiente bloque."
        items = ", ".join(task.get("title", "Tarea") for task in urgent[:3])
        return f"Las tareas urgentes son: {items}. Te recomiendo resolverlas primero para evitar bloqueos."

    if any(word in text for word in ["resumen", "estado", "avance", "progreso", "cómo va"]):
        return (
            f"Resumen del proyecto: {task_summary['completed']} tareas completadas, "
            f"{task_summary['pending']} pendientes y {task_summary['urgent']} urgentes. "
            f"El avance general es del {task_summary['progress']}%."
        )

    if any(word in text for word in ["completada", "completadas", "hecho", "hechos"]):
        completed = [task for task in task_list if task.get("completed", False)]
        if not completed:
            return "Todavía no has completado ninguna tarea. Puedes empezar por la más urgente."
        items = ", ".join(task.get("title", "Tarea") for task in completed[:3])
        return f"Ya tienes {len(completed)} tareas completadas, por ejemplo: {items}."

    if "gracias" in text:
        return "¡Con gusto! Estoy aquí para ayudarte a mantener el proyecto organizado y en marcha."

    if any(word in text for word in ["tarea", "proyecto", "ayuda", "qué", "como"]):
        return (
            "Puedo ayudarte a revisar tus tareas pendientes, detectar urgentes, resumir el avance o sugerir el siguiente paso. "
            f"Ahora mismo tienes {task_summary['pending']} pendientes y {task_summary['urgent']} urgentes."
        )

    return "Estoy listo para ayudarte con el proyecto. Puedo revisar pendientes, priorizar tareas o resumir el estado general."


def generate_ai_reply(message: str, tasks: list[dict] | None = None) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if api_key:
        try:
            context = build_summary(tasks or [])
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=json.dumps(
                    {
                        "model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                        "messages": [
                            {"role": "system", "content": "Eres un asistente útil y profesional en español para apoyo de gestión y priorización de proyectos. Responde de manera clara, práctica y breve."},
                            {"role": "user", "content": f"Contexto del proyecto: {json.dumps(context, ensure_ascii=False)}. Pregunta del usuario: {message}"},
                        ],
                        "temperature": 0.7,
                    }
                ).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
            return payload["choices"][0]["message"]["content"].strip()
        except (urllib.error.HTTPError, urllib.error.URLError, KeyError, ValueError):
            pass
    return fallback_ai_reply(message, tasks)


@app.route("/")
def index():
    return redirect(url_for("game_page"))


@app.route("/game")
def game_page():
    return render_template("game.html")


@app.route("/dashboard")
def dashboard():
    tasks = load_tasks()
    active_filter = request.args.get("filter", "all")
    search = request.args.get("search", "")
    filtered_tasks = filter_tasks(tasks, active_filter, search)
    summary = build_summary(tasks)
    return render_template("index.html", tasks=filtered_tasks, summary=summary, now=datetime.now(), active_filter=active_filter, search=search)


@app.route("/tasks", methods=["POST"])
def add_task():
    title = request.form.get("title", "").strip()
    description = request.form.get("description", "").strip()
    priority = request.form.get("priority", "media")
    category = (request.form.get("category", "") or "General").strip() or "General"
    due_date = (request.form.get("due_date", "") or "").strip()

    if not title:
        return redirect(url_for("index"))

    tasks = load_tasks()
    tasks.insert(
        0,
        {
            "id": next_id(tasks),
            "title": title,
            "description": description or "Sin descripción adicional.",
            "priority": priority,
            "category": category,
            "due_date": due_date,
            "completed": False,
            "created_at": datetime.now().isoformat(timespec="minutes"),
        },
    )
    save_tasks(tasks)
    return redirect(url_for("index"))


@app.route("/tasks/<int:task_id>/toggle", methods=["POST"])
def toggle_task(task_id: int):
    tasks = load_tasks()
    for task in tasks:
        if task.get("id") == task_id:
            task["completed"] = not task.get("completed", False)
            break
    save_tasks(tasks)
    return redirect(url_for("index"))


@app.route("/tasks/<int:task_id>/delete", methods=["POST"])
def delete_task(task_id: int):
    tasks = load_tasks()
    tasks = [task for task in tasks if task.get("id") != task_id]
    save_tasks(tasks)
    return redirect(url_for("index"))


@app.route("/api/chat", methods=["POST"])
def chat_endpoint():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get("message", "")).strip()

    if not message:
        return jsonify({"reply": "Escribe algo para que pueda ayudarte."}), 400

    tasks = load_tasks()
    return jsonify({"reply": generate_ai_reply(message, tasks)})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5001"))
    app.run(host="0.0.0.0", port=port, debug=True)
