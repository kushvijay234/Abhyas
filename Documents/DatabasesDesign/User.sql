-- User Sql

CREATE TABLE User (
    user_id INT PRIMARY KEY,
    user_name VARCHAR(100),
    email VARCHAR(100),
    mobile VARCHAR(15),
    password VARCHAR(100),
    admin_id INT,
    FOREIGN KEY (admin_id) REFERENCES Admin(admin_id)
);
