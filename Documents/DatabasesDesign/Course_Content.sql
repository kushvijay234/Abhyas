-- COURSE_CONTAIN

CREATE TABLE Course_Contain (
    course_id INT,
    exam_id INT,
    PRIMARY KEY (course_id, exam_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id),
    FOREIGN KEY (exam_id) REFERENCES Exam(exam_id)
);