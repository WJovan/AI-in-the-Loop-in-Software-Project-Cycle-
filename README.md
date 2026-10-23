# AI in the Loop in Software Project Cycle

## Team Members
- 黃金山 - 112550177
- 曾健倫 - 112550114
- 邱建錡 - 112550132
- 李典陽 - 314551170

## Collaboration Problem

University students working on group software projects may have different expectations about when AI should or should not be used.

For example, one member may be comfortable using AI to generate code, while another may prefer using AI only for debugging or explanations. Without a clear agreement, these differences may cause misunderstandings about how tasks should be completed and reviewed.

Our project focuses on helping team members discuss, compare, and agree on their boundaries for AI usage.

## Project Description

Our proposed project is AI Boundary Board, a collaborative tool that helps students decide when AI should be involved in group assignments and software development tasks.

The tool will allow users to:

Create a shared project and add activities or topics.

Choose whether AI should be allowed, limited, or not allowed for each activity.

Explain the reasons behind their choices.

Compare their preferences with other team members.

Discuss disagreements and record a final shared agreement.

The goal is not to replace human decision-making, but to make discussions about AI usage clearer and more transparent.


## Course
AI-in-the-Loop in Software Project Cycle
Fall 2026


# AI Usage Guidelines

## 1. AI Tools We Plan to Use and What We Will Use Them For

Our team plans to use AI tools such as ChatGPT and GitHub Copilot to support our software development process.

*ChatGPT*

* We will use ChatGPT for brainstorming ideas, explaining unfamiliar concepts, debugging assistance, and comparing possible approaches to technical problems.
* We may also use it to generate initial drafts of documentation, test cases, and simple code structures.
* We will not rely on ChatGPT to make final project decisions. Important decisions, such as project scope, architecture, evaluation criteria, and whether an AI-generated solution should be accepted, will remain human decisions.

*GitHub Copilot*

* We may use GitHub Copilot for inline code completion, repetitive code, and simple implementation suggestions.
* Copilot-generated code will not be merged directly into main without human review.
* We will not treat generated code as correct simply because it was suggested by Copilot. Team members must understand and review the code before accepting it.

In general, AI is used as an assistant rather than a decision-maker. Humans remain responsible for understanding, reviewing, and approving the final work.

## 2. How We Will Document AI Interactions

AI interactions that significantly contribute to the project will be documented.

An interaction should be recorded when AI:

* generates code or text that is included in the project;
* suggests an approach that changes our implementation or design;
* helps solve a significant technical problem; or
* contributes to a project decision.

For these interactions, we will record the AI tool/model used, the purpose of the interaction, a summary of the prompt, and what parts of the AI output were accepted, modified, or rejected.

Small interactions such as syntax lookups, explanations of basic concepts, or minor debugging questions do not need to be individually documented unless their output directly becomes part of the project.

Pull request descriptions will briefly state whether AI was involved. If an AI suggestion causes a significant change to our project approach or design, the resulting decision and reasoning will also be recorded in DECISIONS.md.

## 3. How We Will Handle Disagreements About AI Output Quality

AI-generated output will not be accepted based only on whether it appears reasonable.

When team members disagree about the quality of an AI-generated output, we will first evaluate it using available evidence. For code, this includes whether it passes relevant tests, follows project requirements, is understandable to another team member, and passes human code review.

For non-code suggestions, we will compare the output against project requirements, available evidence, and the team's previously agreed decisions.

If the disagreement cannot be resolved using these criteria, the current code steward will make the final decision. Significant decisions resulting from such disagreements will be briefly documented in DECISIONS.md.

A majority vote alone is not considered sufficient evidence that an AI-generated output is correct.

# Draft Evaluation Plan

## Problem Grounding

Our target users are university students working in small teams on software or technical projects.

We want to investigate whether different expectations about AI usage create difficulties during collaboration.

We will conduct interviews with at least two students outside our team to understand their experiences, how they currently discuss AI usage, and whether existing tools sufficiently support those discussions.

## Success Definition

We will know our tool works if students can use it to compare their AI usage preferences, identify disagreements, and create a shared agreement.

We will measure whether users can complete the main workflow without assistance, understand their teammates' preferences, and find their final agreement afterward.

## Target Users

We plan to recruit at least six university students, working in three pairs, who have experience with group assignments and generative AI tools.

Participants will be recruited from classmates or other students outside our development team.

## Evaluation Method

After completing an initial working prototype, we plan to conduct a small user study during a later project checkpoint.

Each pair will receive a group assignment scenario involving several possible uses of AI.

First, participants will individually decide whether AI should be allowed for each activity.

Then, they will use AI Boundary Board to compare their choices, discuss disagreements, and record a final agreement.

We will observe the process and collect short feedback through a questionnaire.

## Minimum Evidence Threshold

We will consider the initial evaluation promising if:

At least two out of three pairs complete the main workflow without direct assistance.

At least two pairs successfully identify and resolve or document their disagreements.

The average clarity rating is at least 4 out of 5.

Participants can locate their final shared agreement after completing the task.

These are initial targets and may be adjusted based on early user feedback.

## Human-AI Boundary

For the initial prototype, we propose using rule-based logic to compare users' selections and highlight disagreements without generating AI recommendations.

Human users will decide which activities allow AI, what restrictions are needed, and what the final agreement should be.

We may consider optional AI-assisted recommendations in later versions, but final decisions will remain with human team members.
