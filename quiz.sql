CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT,
    password TEXT
);
INSERT INTO users(email,password) VALUES('abc@gmail.com','12345')
CREATE TABLE quiz (
   user_id INTEGER,
    title TEXT,
    quiz_id INTEGER
);
CREATE TABLE question (
   user_id INTEGER,
    quiz_id INTEGER,
     question TEXT,
     answer TEXT
);