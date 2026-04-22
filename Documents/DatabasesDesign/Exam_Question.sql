-- EXAM_QUESTION (Many-to-Many)

CREATE TABLE Exam_Question (
    exam_id INT,
    question_id INT,
    PRIMARY KEY (exam_id, question_id),
    FOREIGN KEY (exam_id) REFERENCES Exam(exam_id),
    FOREIGN KEY (question_id) REFERENCES Question(question_id)
);