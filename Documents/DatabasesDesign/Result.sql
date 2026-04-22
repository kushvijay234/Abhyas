-- Result Sql

CREATE TABLE Result (
    result_id INT PRIMARY KEY,
    user_id INT,
    exam_id INT,
    marks INT,
    percentage FLOAT,
    submission_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (exam_id) REFERENCES Exam(exam_id)
);