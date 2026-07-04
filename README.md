# Human Resource Information System

A web-based Human Resource Information System designed to manage core HR operations such as attendance, leave management, overtime, and business trip workflows with a structured approval system.

This project is developed as a final-year thesis project with a focus on backend architecture, workflow design, role-based access control, and modular system structure.

---

## Features

Employee Management

- Employee data management
- User authentication system
- Role-based access control (Admin, Manager, HR, Director)

Attendance System

- Daily check-in and check-out
- Attendance history tracking
- Attendance correction request

Leave Management

- Leave request submission
- Leave approval workflow
- Leave balance tracking

Overtime Management

- Overtime request submission
- Manager approval process
- Work result documentation

Business Trip Module

- Business trip request submission
- Multi-level approval flow (Manager → HR / Director)
- Trip timeline and itinerary tracking
- Budget tracking and monitoring

---

## System Workflow

Employee submits a request (leave, overtime, or business trip). The request is reviewed by the Manager for initial approval. Depending on the module, HR or Director provides final approval. Finance can monitor approved business trip budgets for operational tracking and fund disbursement purposes.

---

## Tech Stack

Backend

- Node.js
- Express.js

Database

- MongoDB
- Mongoose ODM

Frontend

- EJS (Server Side Rendering)
- Tailwind CSS

Authentication

- Session-based authentication
- Role-based access control (RBAC)

---

## Project Structure

src/
├── controllers/
├── models/
├── routes/
├── middleware/
├── views/
├── services/
└── app.js

---

## Roles

Employee: submits requests and views personal data  
Manager: handles initial approval of requests  
HR / Director: handles final approval depending on workflow  
Finance: monitors approved business trip budgets for reporting and fund processing

---

## Project Status

This project is currently under active development as part of a final-year academic requirement. Improvements are continuously being made in system design, validation, UI consistency, modular architecture, and workflow optimization.

---

## Author

GitHub: https://github.com/mseptiawan  
LinkedIn: https://www.linkedin.com/in/mseptiawan/  
Email: mseptiawan017@gmail.com

---

## License

This project is for educational purposes only.
