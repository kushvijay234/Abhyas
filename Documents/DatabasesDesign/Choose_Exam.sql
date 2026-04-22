-- CHOOSE_EXAM (User selects exam)

CREATE TABLE Choose_Exam (
    choose_exam_id INT PRIMARY KEY,
    user_id INT,
    exam_id INT,
    choose_exam_date DATE,
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES User(user_id),
    FOREIGN KEY (exam_id) REFERENCES Exam(exam_id)
);