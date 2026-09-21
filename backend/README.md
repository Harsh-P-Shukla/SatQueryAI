# 🚀 SatQuery AI Backend
> For the verified Windows setup, real endpoint paths and public-model limitations, use [SETUP_STATUS.md](../SETUP_STATUS.md). The legacy examples below may describe unavailable features.

The backend service for the SatQuery AI Platform, providing APIs for image uploads, captioning, grounding, visual question answering, translation, and chat history management.
<br>
Developed using **Node.js, Express, PostgreSQL, Multer, and Python-based inference microservices**.

## 📌 Features

- 🔐 User authentication (Signup & Login)
- 🖼 Image upload with static file serving
- 💬 Chat logging and message storage
- 🧠 Visual question answering
- 📸 Image captioning microservice integration
- 🎯 YOLO-based visual grounding
- 🌍 Multilingual translation support
- 🗑 Complete history deletion for a user
- 🗃 Persistent PostgreSQL storage for users, chats, and messages

## 🛠 Tech Stack

- Node.js + Express
- PostgreSQL
- Multer for uploads
- Python inference (YOLO, captioning)
- Static file hosting via `/api/uploads` and `/api/results`

## 📂 Project Structure

<pre>
backend/
│── routes/
│ ├── auth.route.js
│ ├── upload.route.js
│ ├── chat.route.js
│ └── query.route.js
│── uploads/
│── results/
│── db.js
│── final_script.py
└── server.js
</pre>

## ⚙️ Installation

1. Install Node dependencies  
   npm install
2. Create required folders  
   mkdir uploads results
3. Configure environment (config.js)
4. Start the server  
   node server.js

## 📡 API Endpoints

### 🔐 Authentication – /api/auth
| Method | Endpoint  | Description                    |
| ------ | --------- | ------------------------------ |
| POST   | `/signup` | Registers a new user           |
| POST   | `/login`  | Authenticates an existing user |


**Request Body (Signup)**
  <pre>
  {
    "name": "John",
    "email": "john@example.com",
    "password": "pass123"
  }
</pre>

**Request Body (Login)**
  <pre>
  {
    "email": "john@example.com",
    "password": "pass123"
  }</pre>

### 🖼 Upload – /api/upload
| Method | Endpoint | Description                         |
| ------ | -------- | ----------------------------------- |
| POST   | `/`      | Uploads a single image using Multer |

**Request (multipart/form-data)**
<pre>
  image: File
</pre>

**Response**
  <pre>
  {
    "imageUrl": "http://backend/api/uploads/170000000.jpg"
  }</pre>

### 🧠 Query System – /api/query
| Method | Endpoint      | Description                                           |
| ------ | ------------- | ----------------------------------------------------- |
| POST   | `/captioning` | Generates a caption using the captioning microservice |
| POST   | `/grounding`  | Performs YOLO-based grounding                         |
| POST   | `/vqa`        | Sends prompt and image to VQA service                 |
| POST   | `/evaluate`   | For evalution of JSON queries                         |

**Captioning Request**
<pre>
  {
    "chatId": 1,
    "query": "Describe the image"
  }
</pre>

**Grounding Request**
<pre>
  {
    "chatId": 1,
    "query": "highlight buildings"
  }
</pre>

**Grounding Response**
<pre>
  {
    "generated_image": "http://backend/api/results/170000_output.jpg"
  }
</pre>

**VQA Request**
<pre>
  {
    "chatId": 1,
    "query": "Explain the object on the right",
  }
</pre>

## 🗃 Database Overview

### users

<pre>
| id | name | email | password |
</pre>

### chats

<pre>
| id | user_id | image_url | updated_at |
</pre>

### messages

<pre>
| id | chat_id | query | text_answer | generated_image |
</pre>

## 📝 Static File Access
| Folder     | Route                     |
| ---------- | ------------------------- |
| `uploads/` | `/api/uploads/<filename>` |
| `results/` | `/api/results/<filename>` |

Accessible directly from the browser.

## 🔄 Inference Flow (Summary)

### 📸 Captioning Flow

1. Fetch chat image
2. Send to captioning microservice
3. Receive and store caption in database

### 🎯 Grounding Flow
1. Trigger YOLO inference script
2. Save output image to /results
3. Store reference in database

### 💬 VQA Flow
1. Send prompt + image URL to vqa microservice
2. Receive text response
3. Store message in database

## 🛡 Error Handling

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 400  | Missing fields / invalid request         |
| 404  | Resource not found                       |
| 500  | Internal server / inference / DB failure |

