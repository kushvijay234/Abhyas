-- Exam Sql

CREATE TABLE Exam (
    exam_id INT PRIMARY KEY,
    exam_name VARCHAR(100),
    category VARCHAR(50),
    level VARCHAR(50),
    duration INT,
    total_marks INT
);