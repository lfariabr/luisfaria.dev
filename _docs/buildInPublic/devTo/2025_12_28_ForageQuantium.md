# I Built a Sales Visualizer for a Real Business Problem (Quantium Software Engineering Simulation)

**Tags**:  `python` `datascience` `webdev` `bash`

---

End of the year and I thought it would be a great way to close out 2025 by putting myself through this Software Engineering simulation presented by [Quantium](https://quantium.com/) on Forage.

After tackling the [Tata GenAI Data Analytics Challenge](https://dev.to/lfariaus/how-i-tackled-genai-powered-data-analytics-and-unlocked-a-new-perspective-on-ai-strategy-hl8) and building various data-driven applications, I was ready for another hands-on project. That's when I discovered **Quantium's Software Engineering simulation**.

As someone who loves building practical solutions, I figured this would sharpen my skills in data processing, visualization, and end-to-end application development. Spoiler: it delivered exactly that.

> "The best way to learn is by building something real."

Here's my journey of building a production-quality data visualizer from raw CSV files to a polished, interactive Dash application.

> **Want to jump in yourself?** Check out the simulation [here](https://www.theforage.com/simulations/quantium/software-engineering-j6ci) before reading. **SPOILER ALERT** ahead!

---

## The Scenario: Software Engineer at Quantium

The simulation places you in the role of a **software engineer** at Quantium, working in the financial services business area. Here's the brief:

> **Client:** Soul Foods  
> **Problem:** Sales decline on their top-performing candy product (Pink Morsels) after a price increase  
> **Goal:** Build an interactive data visualizer to answer: "Were sales higher before or after the price increase on January 15, 2021?"

This wasn't just a tutorial exercise. This was about **solving a real business question with code**.

---

## The Challenge: Six Progressive Tasks

What I loved about this simulation was the progressive scaffolding. Each task built naturally on the previous one, mirroring how real software projects evolve.

---

### Task 1: Set Up Local Development Environment
The first task was all about the fundamentals—forking the repo, setting up a Python virtual environment, and installing dependencies like Dash and Pandas.

**The mindset shift:** Don't underestimate a well-organized workbench. Time invested here pays dividends throughout the project.

---

### Task 2: Data Processing — The Art of Reshaping Data
With the environment ready, I tackled three messy CSV files containing transaction data for Soul Foods's entire morsel product line. My job? Transform raw data into actionable insights.

The transformation pipeline:
- **Filter:** Keep only Pink Morsels rows (bye-bye, other products)
- **Calculate:** Multiply quantity × price to get `Sales`
- **Normalize:** Handle currency symbols, parse dates, standardize regions
- **Output:** A clean CSV with just `Sales`, `Date`, and `Region`

I built a robust ETL script with flexible column detection (`find_column`) to handle variations in column naming. This kind of defensive coding is essential for real-world data pipelines.

---

### Task 3: Create the Dash Application
Now the fun part—bringing data to life! I built a Dash application with:
- A clear header explaining the business question
- An interactive line chart showing daily sales over time
- A vertical marker highlighting the price increase date (2021-01-15)

The visualization immediately answered Soul Foods's question—you can literally *see* the sales impact.

**Key pattern:** Let the data speak for itself. A simple line chart with a clear annotation was more powerful than any fancy visualization.

---

### Task 4: Make It Interactive & Beautiful
Soul Foods wanted to dig into region-specific data. I added:
- **Radio buttons** to filter by region (North, East, South, West, or All)
- **Custom CSS styling** with a modern, clean aesthetic
- **Responsive design** that works on different screen sizes

The callback pattern in Dash made this incredibly smooth—select a region, and the chart updates instantly.

---

### Task 5: Write a Test Suite
Any production-grade codebase needs robust testing. I created tests to verify:
- The header is present
- The visualization graph is rendered
- The region picker is functional

Using pytest with Dash's testing framework, I built recursive component finders that traverse the layout tree. These tests may seem simple, but they protect against regressions as the codebase evolves.

---

### Task 6: Automate Everything with CI
The final task brought it all together with a bash script for continuous integration:
- Automatically activates the virtual environment
- Installs dependencies if needed
- Runs the full test suite
- Returns proper exit codes for CI engines

This is the kind of automation that lets teams ship with confidence.

---

## Why This Challenge is Cool?

**1. Progressive Complexity**
Each task built naturally on the previous one. By the end, I had context and momentum to make smart architectural decisions.

**2. Real-World Messiness**
The data had quirks—currency symbols in price fields, inconsistent column names, multiple input files. This forced me to write defensive, production-quality code.

**3. End-to-End Ownership**
From raw CSVs to a deployed application with tests and CI—I touched every layer of the stack.

**4. Practical Business Context**
The question "Were sales higher before or after the price increase?" is exactly the kind of question real businesses ask. Building tools to answer it felt meaningful.

**5. Modern Stack**
Dash + Plotly + Pandas is a legitimate toolchain used in production. The skills transfer directly to real projects.

---

## What I Built

Here's what I delivered:

| Deliverable | What It Does |
|-------------|-------------|
| **Data Processing Script** | Transforms 3 raw CSVs into a clean, analysis-ready dataset |
| **Dash Application** | Interactive sales visualizer with region filtering |
| **Visualization Module** | Plotly line chart with price-increase annotation |
| **Test Suite** | Pytest-based tests verifying core UI components |
| **CI Automation** | Bash script for automated testing in CI pipelines |

---

## Tech Stack

- **Python 3.9** — The foundation
- **Dash** — Web framework for data applications
- **Plotly Express** — Interactive, beautiful charts
- **Pandas** — Data manipulation powerhouse
- **Pytest** — Testing framework
- **Bash** — CI automation scripting
- **CSS** — Custom styling for a polished UI

- 👉 [My Submitted Repo](https://github.com/lfariabr/quantium-starter-repo)
- 👉 [Original Source Code](https://github.com/vagabond-systems/quantium-starter-repo)

---

## Key Takeaways

This challenge reinforced critical principles I apply to every project:

1. **Start with clean data**: Garbage in, garbage out. Invest in robust ETL.
2. **Let the data speak**: Simple visualizations often tell better stories than complex ones.
3. **Build for humans**: A pretty UI isn't vanity—it's usability.
4. **Test early, test often**: Even simple tests catch real bugs.
5. **Automate the boring stuff**: CI scripts save hours of manual work.
6. **Modular architecture wins**: Separating data, viz, and web layers made iteration easy.

---

## Try It Yourself

If you'd like to give this challenge a shot:  
👉 [Quantium Software Engineering Simulation](https://www.theforage.com/simulations/quantium/software-engineering-j6ci)

Then come back and tell me:
- How did you style your visualizer?
- What patterns did you discover in the data?
- Did the sales actually go up or down after the price increase? 😏

---

## Potential Next Steps

The foundation is solid. Here's where this could go:

| Enhancement | Description |
|-------------|-------------|
| **Additional Filters** | Add date range pickers or product type selectors |
| **Statistical Annotations** | Show before/after averages directly on the chart |
| **Docker Deployment** | Containerize for easy cloud deployment |
| **Database Backend** | Replace CSV with a proper data store |
| **Advanced Analytics** | Trend lines, forecasting, anomaly detection |

---

## Final Thoughts

This project stretched me across roles: data engineer, frontend developer, and DevOps practitioner. But that's the point—real software problems don't come in neat boxes.

I walked away with a working application, clean architecture, and practical experience with a modern data visualization stack. That's the kind of outcome I aim for in every project.

**The answer to Soul Foods's question?** Run the app yourself and find out. The data doesn't lie. 📊
