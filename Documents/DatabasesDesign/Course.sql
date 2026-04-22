-- Course Sql

CREATE TABLE Course (
    course_id INT PRIMARY KEY,
    course_name VARCHAR(100),
    description TEXT,
    admin_id INT,
    FOREIGN KEY (admin_id) REFERENCES Admin(admin_id)
);