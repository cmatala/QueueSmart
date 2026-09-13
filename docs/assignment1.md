# QueueSmart

## Assignment 1 – Initial Thoughts and System Design

### Team Members

- Celestin Matala
- Celeste
- Megan
- Valeriia

---

## 1. Initial Thoughts
<!-- Owner: Celeste -->

### Main Users

### User Interaction

### Important Features

### Challenges

---

## 2. Development Methodology
<!-- Owner: Megan -->

### Agile / Scrum

### Why It Fits QueueSmart

### Team Workflow

---

## 3. High-Level Architecture

### System Context Diagram
<!-- Owner: Valeriia -->

![System Context Diagram](diagrams/system-context.png)

### Context Diagram Explanation
<!-- Owner: Valeriia -->

The System Context Diagram describes QueueSmart as a whole system and depicts the interaction between the key users/administrator and the external systems with QueueSmart.

User (Customer): The user interacts with QueueSmart in order to choose the service, join/leave the queue, see their current position in the queue, and their estimated waiting time. In addition to that, QueueSmart provides queue status and notifications to the user.

Administrator (Staff): The administrator interacts with QueueSmart in order to create/manage services, manage queues and priorities, serve the next customer, and monitor the queue activities. QueueSmart may also provide basic queue activity reports to the administrator.

Email / Notification Service: QueueSmart interacts with the external Email/Notification Service in order to send email notifications to the users. Such notifications can be related to the fact that it is time to see the customer.

In general, QueueSmart is the central system connecting the users, the administrator, and the external notification system. This diagram highlights the main interactions without going into implementation details, such as programming languages, frameworks, and APIs.

### Container Diagram
<!-- Owner: Celestin -->

![Container Diagram](diagrams/container-diagram.png)

### Architecture Explanation
<!-- Owner: Celestin -->

The Container Diagram shows the main components inside the QueueSmart system and how they communicate. The Email/Notification Service is outside the QueueSmart boundary because it is an external service used by the system.

Web Application: The responsive interface used by customers and administrators. Users can join queues, view their position and estimated wait time, while administrators can manage services and queues.

API / Backend Server: Receives requests from the web application and connects the interface to the system's internal components.

Authentication: Handles registration, login, email verification, and User/Administrator roles.

Queue Management: Manages queue entries and determines the order in which users are served. Queue order is primarily based on arrival time, with priority levels used when necessary.

Wait-Time Estimator: Calculates estimated wait time using the number of people ahead in the queue and the expected service duration.

Notification Manager: Determines when users should receive queue notifications and communicates with the external Email/Notification Service.

Database: Stores information about users, services, queue entries, and notifications.

#### How the System Works

When a user joins a queue, the request goes from the Web Application to the Backend Server. The system verifies the user, adds them to the queue, stores the information in the database, and calculates their estimated wait time.

When an administrator serves the next customer, Queue Management updates the queue. The Wait-Time Estimator updates the remaining wait times, and the Notification Manager can send an email when a user's turn is approaching.

This architecture separates the user interface, system logic, data storage, and external notifications. This makes QueueSmart easier to maintain and provides a foundation for the API and data design in later assignments.
## 4. Team Contributions

See [CONTRIBUTIONS.md](../CONTRIBUTIONS.md).
