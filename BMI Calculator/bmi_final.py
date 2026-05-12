import tkinter as tk
from tkinter import messagebox
import pyttsx3
import speech_recognition as sr
import csv
import os
import matplotlib.pyplot as plt

# ---------------------------
# Voice Engine
# ---------------------------
engine = pyttsx3.init()

def speak(text):
    engine.say(text)
    engine.runAndWait()

# ---------------------------
# Voice Input
# ---------------------------
def listen():
    r = sr.Recognizer()
    with sr.Microphone() as source:
        try:
            status_label.config(text="Listening...")
            audio = r.listen(source)
            text = r.recognize_google(audio)
            status_label.config(text=f"You said: {text}")
            return text
        except:
            status_label.config(text="Voice error!")
            return None

# ---------------------------
# AI Suggestion
# ---------------------------
def get_advice(bmi):
    if bmi < 18.5:
        return "Increase calorie intake, eat protein-rich food."
    elif bmi < 25:
        return "Great! Maintain your healthy lifestyle."
    elif bmi < 30:
        return "Exercise regularly and reduce junk food."
    else:
        return "Consult a doctor."

# ---------------------------
# Save Data
# ---------------------------
def save_data(name, age, gender, weight, height, bmi, category):
    file_exists = os.path.isfile("data.csv")

    with open("data.csv", "a", newline="") as f:
        writer = csv.writer(f)

        if not file_exists:
            writer.writerow(["Name","Age","Gender","Weight","Height","BMI","Category"])

        writer.writerow([name, age, gender, weight, height, round(bmi,2), category])

# ---------------------------
# Dashboard
# ---------------------------
def show_dashboard():
    try:
        total = 0
        sum_bmi = 0

        with open("data.csv", "r") as f:
            reader = csv.reader(f)
            next(reader)

            for row in reader:
                total += 1
                sum_bmi += float(row[5])

        avg_bmi = round(sum_bmi / total, 2)

        messagebox.showinfo("Dashboard",
            f"Total Users: {total}\nAverage BMI: {avg_bmi}")

    except:
        messagebox.showerror("Error", "No data found")

# ---------------------------
# Graph
# ---------------------------
def show_graph():
    try:
        names = []
        bmis = []

        with open("data.csv", "r") as f:
            reader = csv.reader(f)
            next(reader)

            for row in reader:
                names.append(row[0])
                bmis.append(float(row[5]))

        plt.figure()
        plt.plot(names, bmis, marker='o')
        plt.axhline(y=25, linestyle='--')
        plt.title("BMI Trend")
        plt.xlabel("Users")
        plt.ylabel("BMI")
        plt.xticks(rotation=45)
        plt.tight_layout()
        plt.show()

    except:
        messagebox.showerror("Error", "No data found")

# ---------------------------
# Calculate BMI
# ---------------------------
def calculate_bmi():
    try:
        name = name_entry.get()
        age = age_entry.get()
        gender = gender_entry.get()

        weight = float(weight_entry.get())
        height = float(height_entry.get())

        if weight <= 0 or height <= 0:
            messagebox.showerror("Error", "Invalid input!")
            return

        bmi = weight / (height ** 2)

        if bmi < 1.5:
            category = "Underweight"
        elif bmi < 25:
            category = "Normal"
        elif bmi < 30:
            category = "Overweight"
        else:
            category = "Obese"

        advice = get_advice(bmi)

        result = f"{name}, BMI: {round(bmi,2)}\n{category}\nAdvice: {advice}"
        result_label.config(text=result)

        speak(f"Your BMI is {round(bmi,2)}. {advice}")

        save_data(name, age, gender, weight, height, bmi, category)

    except:
        messagebox.showerror("Error", "Enter valid input!")

# ---------------------------
# Voice Assistant Mode
# ---------------------------
def voice_assistant():
    speak("Tell your weight")
    w = listen()

    speak("Tell your height")
    h = listen()

    try:
        weight_entry.delete(0, tk.END)
        weight_entry.insert(0, w)

        height_entry.delete(0, tk.END)
        height_entry.insert(0, h)

        calculate_bmi()

    except:
        speak("Error in voice input")

# ---------------------------
# THEME TOGGLE
# ---------------------------
def toggle_theme():
    current = root.cget("bg")

    if current == "#0f172a":
        root.config(bg="white")
    else:
        root.config(bg="#0f172a")

# ---------------------------
# GUI DESIGN
# ---------------------------
root = tk.Tk()
root.title("Smart BMI App")
root.geometry("420x600")
root.config(bg="#0f172a")

# Title
tk.Label(root, text="Smart BMI Calculator",
         font=("Helvetica", 18, "bold"),
         bg="#0f172a", fg="#38bdf8").pack(pady=15)

# Name
tk.Label(root, text="Name", bg="#0f172a", fg="white").pack()
name_entry = tk.Entry(root)
name_entry.pack()

# Age
tk.Label(root, text="Age", bg="#0f172a", fg="white").pack()
age_entry = tk.Entry(root)
age_entry.pack()

# Gender
tk.Label(root, text="Gender", bg="#0f172a", fg="white").pack()
gender_entry = tk.Entry(root)
gender_entry.pack()

# Weight
tk.Label(root, text="Weight (kg)", bg="#0f172a", fg="white").pack()
weight_entry = tk.Entry(root)
weight_entry.pack()

tk.Button(root, text="🎤 Speak Weight",
          command=lambda: weight_entry.insert(0, listen()),
          bg="#22c55e", fg="white").pack(pady=5)

# Height
tk.Label(root, text="Height (m)", bg="#0f172a", fg="white").pack()
height_entry = tk.Entry(root)
height_entry.pack()

tk.Button(root, text="🎤 Speak Height",
          command=lambda: height_entry.insert(0, listen()),
          bg="#22c55e", fg="white").pack(pady=5)

# Buttons
tk.Button(root, text="Calculate BMI",
          command=calculate_bmi,
          bg="#3b82f6", fg="white").pack(pady=10)

tk.Button(root, text="🎙️ Voice Mode",
          command=voice_assistant).pack(pady=5)

tk.Button(root, text="Dashboard",
          command=show_dashboard).pack(pady=5)

tk.Button(root, text="Show Graph",
          command=show_graph).pack(pady=5)

tk.Button(root, text="Toggle Theme",
          command=toggle_theme).pack(pady=5)

# Result
result_label = tk.Label(root, text="",
                        bg="#0f172a",
                        fg="#facc15",
                        font=("Arial", 12))
result_label.pack(pady=15)

# Status
status_label = tk.Label(root, text="",
                        bg="#0f172a",
                        fg="gray")
status_label.pack()

root.mainloop()