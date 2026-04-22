-- Question Sql

CREATE TABLE Question (
    question_id INT PRIMARY KEY,
    question_text TEXT,
    option1 VARCHAR(255),
    option2 VARCHAR(255),
    option3 VARCHAR(255),
    option4 VARCHAR(255),
    correct_option INT,
    explanation TEXT,
    exam_id INT,
    FOREIGN KEY (exam_id) REFERENCES Exam(exam_id)
);