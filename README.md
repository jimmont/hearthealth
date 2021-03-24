Below is the original problem set with responses inline for part 2.

1 To run it install Deno by following the instructions at https://deno.land
2 Run app.js with Deno by invoking the command in the comment at the top of that script.
3 The script will suggest opening localhost on the given port in stdout.
4 Look at the page, select a user as it suggests, interact with the chart.
5 Provide feedback to me via email that you have or found at www.jimmont.com


# Frontend Assignment

This assignment consists of two tasks:
1. Create a web frontend for displaying measurements from the Bodyport Cardiac Scale
2. Write a proposal for ways to improve the system

Feel free to use any languages, frameworks or libraries you decide are suitable.
Document your choices and provide setup instructions so we can verify your work.

## API setup
This repository contains a python backend for retrieving measurements at `http://localhost:5000/measurements`.
You may make changes to the Python code if you want, but it's not required.

```
python --version    # must be >= 3.7
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py      # start the server on port 5000 
```

## Task 1
Create a web page that loads measurements from the server and displays them on a plot.
Measurements do not belong to the same user, so your interface should allow for switching between users.
Your plot should be able to support the entire measurement history for each patient.
Use your best judgement when designing the UI.
Your submission will be graded based on its design, usability, functionality, and code quality.

## Task 2
Suppose new data points become accessible and you'd like to surface them to your customers.
These could be patient symptoms, hospital visits, medication changes, diet logs, risk calculations, etc...
Write up a proposal for the next version of your dashboard.
It should address these questions, as well as any other product or development concerns that come to mind.
* How should these extra data points be surfaced on your site?
Do they belong on the plot, near it, or on a separate page?

- I'd need to understand the audience and requirements to answer this question.
Often this is guided by the questions:
* What and why are we communicating?
* Who is our audience and what do we know about them?
* What specific requirements exist for the solution and context?
This typically is a short collection of a few paragraphs that informs all the details and can be referenced or updated when required.

* How should the API be updated to support your new design?
Are there any performance limitations that should be taken into consideration?
- the API and UI need pagination, with better limits and complete standard associated detail
- most of the API call performance are isolated to the performance of the related services and caching can be tuned to suit the need
- libraries can be versioned and cached separate from the data, tuned to fit those distinct needs, with loading indicators or whatever fits the UX need
- logging/monitoring and routine maintenance/tuning usually covers issues related to performance
- this all assumes some sort of straightfoward software development lifecycle where features roll out, are tested and then go in front of customers, with a rollback and forward plan, various testing strategies, automated where it saves time and improves predictability

* Is your current design too strict?
What is an appropriate degree of flexibility?
- It seems to work ok. The range of data provided fits overall and allows the user to scan or surface all the details based on the info provided and my assumptions based on working in healthcare.
- I'm sure it could be improved, there are several details I noticed.

How would future developers extend your work?
- Some of the features could be generalized, currently it's intended only to solve the given problem.
- The piece needs some tests.

* Can you assess the usability of newly added features?
- I haven't tested this.

How do you know the end users are satisfied?
- Ask them what they are able to do with the info, how it helps them and how they use it (after)
- What do they want to do with the data?
- What can be done to make that easier?
- Generally ask them, engage them in dialog where appropriate, provide visibility into what we're doing to engage them
- On some interval provide short, simple surveys, optionally contact for more, or allow open ended feedback:
	1a Does this make [X] easier? Yes/Unsure/No
	1b Are the changes [better][unchanged][worse]?
	1c Any feedback? [textarea]
		- email for followup and build a list of users to focus on

	2a What needs improvement most [select from shortlisted topics or backlog or whatever, with an "other" category]?
	2b Any feedback? [textarea for open-ended feedback]
		- email for followup and build a list of users to focus on

	3a What are your biggest pain points? Where do you spend most time? ... etc

- instrument the UI in a generic way to collect usage info in logs

- provide UI experiments, user-controlled, or tests

- ask them in meetings, informational interviews, usability sesssions, etc

- provide channels for feedback, invite participation,

- publish/evangelize iteration process to passively engage the audience 

- treat them like I would want to be treated with any product I use... my phone, my email client, my browser, etc
	some I don't want to participate, others sure
	
- catalog what works, what doesn't, ... maintain a backlog, etc

- keep a tab on what works in the industry, network, etc

.headers on
sqlite> .mode column
sqlite> select * from measurements;
id                            user_id                         creation_date           weight_kg   heart_rate  peak_count  body_fat_percent  backend_sway_area_mm2
----------------------------  ------------------------------  ----------------------  ----------  ----------  ----------  ----------------  ---------------------
BP191907YFZZ102220182844002t  Prk4rPK2B2c3gSaJrfro5ZVFcWKmoT  2020-10-22 11:28:00-07  69.82       82          14          23.0
BP191907YFZZ102220175849002s  Prk4rPK2B2c3gSaJrfro5ZVFcWKmoT  2020-10-22 10:58:29-07  69.82       74          19          22.9              54
BP192607TAKM092820111952000s  GRe2S6CUy6iMQMGZSVTNW2biwE3vt4  2020-09-28 04:19:21-07  55.13       72          18          37.0              286922
BP192607TAKM1116201219370007  GRe2S6CUy6iMQMGZSVTNW2biwE3vt4  2020-11-16 04:19:12-08  55.87       73          19          38.2              76
BP192607TAKM0924201554510009  GRe2S6CUy6iMQMGZSVTNW2biwE3vt4  2020-09-24 08:54:20-07  55.01       68          14          33.8              20792
BP192607TAKM100720034538001g  GRe2S6CUy6iMQMGZSVTNW2biwE3vt4  2020-10-06 20:45:08-07  55.15       82          19          36.0              109
