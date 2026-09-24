# AI in the Loop in Software Project Cycle

## Team Members
- 黃金山 - 112550177
- 曾健倫 - 112550114
- 邱建錡 - 112550132
- 李典陽 - 314551170

## Collaboration Problem
Things or topics that we keep AI IN and OUT of.

## Project Description
This project explores when AI should and should not be involved
in different stages of collaborative software development.

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

### 1. Who specifically has the collaboration problem?

Our target users are university students working in small teams on software projects where generative AI tools such as ChatGPT or GitHub Copilot are available.

These teams may have different opinions about when AI assistance is appropriate. For example, one member may be comfortable using AI to generate code or make suggestions, while another may prefer certain tasks or decisions to remain entirely human-controlled.

This can create uncertainty about when AI should be involved and who remains responsible for the final decision.

### 2. What do they currently do instead of our tool?

Currently, team members usually decide individually whether to use AI for a task. They may discuss AI usage informally through group chats, meetings, or pull request discussions.

There is often no shared and explicit boundary defining which tasks are appropriate for AI assistance and which tasks should remain human-controlled.

As a result, different team members may follow different personal standards for AI usage.

### 3. What would be observably different if our tool worked?

If our tool works, team members should be able to reach clearer and more consistent decisions about whether AI should be involved in a particular task.

We would expect:

* fewer unresolved disagreements about whether AI should be used;
* greater agreement among team members about AI-IN and AI-OUT situations;
* clearer understanding of why AI is or is not appropriate for a task; and
* clearer human responsibility for final decisions even when AI is involved.

# Evaluation Plan

## Success Definition

We will know our tool works if team members can use it to make clearer and more consistent decisions about when AI should and should not be involved in collaborative tasks.

We will compare participants' decisions and confidence before and after using the tool. We will also examine whether disagreements about AI usage can be resolved more clearly with the tool.

The AI may provide recommendations or information about whether AI involvement is appropriate for a particular task, but it will not make the final decision. Human team members remain responsible for deciding whether AI is used.

Therefore, our evaluation focuses on whether the AI's suggestions are useful enough to help human decision-making rather than whether the AI can autonomously make the correct decision.

## Target Users

Our target users are university students who regularly work in small teams on software or technical projects and have experience using generative AI tools.

For the initial evaluation, we plan to recruit students from our university or classmates who have experience with team projects and AI-assisted work.

## Method

We plan to conduct a small user study.

Participants will first be given several collaborative scenarios involving possible AI use and asked whether they would keep AI IN or OUT and why.

They will then complete similar decisions using our tool.

We will collect:

* participants' decisions;
* their confidence in those decisions;
* the amount or type of disagreement between participants; and
* short qualitative feedback through a post-task questionnaire or interview.

We will compare the results before and after using the tool to determine whether it helps participants make clearer and more consistent decisions.

## Minimum Evidence Threshold

For the initial evaluation, we aim to test the tool with at least 5 participants who have experience with both team projects and generative AI.

At minimum, we would consider the results promising if most participants report that the tool helps them understand or discuss the AI-IN/AI-OUT boundary more clearly, and if we observe improved consistency or confidence in their decisions after using the tool.

The exact quantitative success threshold may be refined during CP1 after the interaction design and evaluation procedure are finalized.
