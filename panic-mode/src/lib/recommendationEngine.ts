        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Sustainable Management & Evaluation",
        category: "Management Evaluation",
        discipline,
        disciplineLabel,
        description: `Diagram the sustainable management strategies implemented ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `in ${subject}`
        }, evaluating strengths, limitations, and stakeholder conflicts.`,
        actionableStep: `Evaluate 2 management solutions ${
          hasExplicitTopics ? `for ${primaryTopic} (${subject})` : `in ${subject}`
        }, comparing economic costs against long-term environmental sustainability.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Map Skills & Quantitative Data Interpretation",
        category: "Data & Map Skills",
        discipline,
        disciplineLabel,
        description: `Practice reading contour maps, population pyramids, climographs, or statistical indices related to ${
          hasExplicitTopics ? `${topicPhrase} in ${subject}` : `${subject}`
        }.`,
        actionableStep: `Interpret a sample graph or topographic map segment associated with ${
          hasExplicitTopics ? `${primaryTopic} (${subject})` : `${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "english": {
      items.push({
        id: 1,
        title: "Thematic Matrix & Authorial Purpose",
        category: "Thematic Analysis",
        discipline,
        disciplineLabel,
        description: `Map out central themes and recurring motifs ${
          hasExplicitTopics ? `in ${topicPhrase} for ${subject}` : `across your ${subject} texts`
        }, identifying the author's primary social, moral, or philosophical commentary.`,
        actionableStep: `Write out the author's core thesis or societal critique embodied ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 2,
        title: "Versatile Textual Evidence Bank",
        category: "Textual Evidence",
        discipline,
        disciplineLabel,
        description: `Memorize 5 to 7 versatile quotes ${
          hasExplicitTopics ? `for ${topicPhrase} in ${subject}` : `for ${subject}`
        }, tagging each with literary devices (metaphor, imagery, symbolism, dramatic irony) and thematic connections.`,
        actionableStep: `Test your recall of 4 direct quotes ${
          hasExplicitTopics ? `from ${primaryTopic} (${subject})` : `for ${subject}`
        } and explain the effect of the literary devices used.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 3,
        title: "Analytical Writing Drill (PEEL / TEEL)",
        category: "Analytical Writing",
        discipline,
        disciplineLabel,
        description: `Write a timed 15-minute PEEL paragraph (Point, Evidence, Explanation, Link) dissecting a key scene, stanza, or passage ${
          hasExplicitTopics ? `from ${topicPhrase} in ${subject}` : `from ${subject}`
        }.`,
        actionableStep: `Draft one tightly argued analytical paragraph analyzing textual evidence ${
          hasExplicitTopics ? `from ${primaryTopic} (${subject})` : `for ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 4,
        title: "Character Arc & Dynamic Relationship Chart",
        category: "Character Dynamics",
        discipline,
        disciplineLabel,
        description: `Diagram the trajectory of major figures ${
          hasExplicitTopics ? `in ${topicPhrase} (${subject})` : `in ${subject}`
        }, noting key turning points, moral conflicts, and structural foil relationships.`,
        actionableStep: `Outline the internal conflict and transformation of a central character ${
          hasExplicitTopics ? `in ${primaryTopic} (${subject})` : `in ${subject}`
        }.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });

      items.push({
        id: 5,
        title: "Prompt Deconstruction & Essay Planning",
        category: "Essay Strategy",
        discipline,
        disciplineLabel,
        description: `Deconstruct 2 past essay prompts ${
          hasExplicitTopics ? `on ${topicPhrase} in ${subject}` : `for ${subject}`
        }, formulating nuanced thesis statements with 3 supporting topic sentences.`,
        actionableStep: `Break down an essay question ${
          hasExplicitTopics ? `on ${primaryTopic} (${subject})` : `on ${subject}`
        } into keywords, formulating an arguable thesis statement.`,
        timeContext: timeNote,
        prepContext: prepNote,
      });
      break;
    }

    case "computer_science": {
      const normSubject = (subject || "").toLowerCase();
      const isArchitectureSubject = isArchitectureTopicOrSubject(normSubject);
      const isArchitectureTopic = topics.some((t) => isArchitectureTopicOrSubject(t));
      const isComputerArchitecture = isArchitectureSubject || isArchitectureTopic;

      if (isComputerArchitecture) {
        const hasPipeline = topics.some((t) => isPipelineTopic(t));
        const hasMesi = topics.some((t) => isMesiTopic(t));
        const hasMemory = topics.some((t) => isMemoryHierarchyTopic(t));

        // Case 1: Pipeline Hazards ONLY (No MESI)
        if (hasPipeline && !hasMesi) {
          items.push({
            id: 1,
            title: "Pipeline Hazards & Forwarding Cycle Trace",
            category: "Pipeline Tracing",
            discipline,
            disciplineLabel,
            description:
              "Construct clock-cycle pipeline execution diagrams across the 5 standard in-order stages: Instruction Fetch (IF), Instruction Decode / Register Read (ID), Execute (EX), Memory Access (MEM), and Write-Back (WB). Identify Read-After-Write (RAW) data dependencies, map active operand forwarding paths (EX->EX and MEM->EX) that bypass register files, and determine where hardware forwarding eliminates stalls.",
            actionableStep:
              "Draw a cycle-by-cycle multi-instruction timing chart for a sequence with back-to-back arithmetic instructions and a dependent instruction, tracing all active forwarding paths and verifying register values.",
            timeContext: timeNote,
            prepContext: prepNote,
          });

          items.push({
            id: 2,
            title: "Load-Use Data Hazards & Stall Bubble Insertion",
            category: "Hazard Resolution",
            discipline,
            disciplineLabel,
            description:
              "Analyze the classic load-use data hazard where an instruction immediately depends on the result of a preceding load instruction. Because loaded memory data is only available at the end of the MEM stage, forwarding alone cannot supply the operand in time for the EX stage of the immediately following instruction; the hazard unit must freeze the PC and IF/ID pipeline registers and insert a 1-cycle stall bubble.",
            actionableStep:
              "Diagram a load-use dependency sequence (LW followed by ADD), identifying the exact clock cycle where the pipeline freezes IF/ID registers and inserts a NOP bubble into the EX stage.",
            timeContext: timeNote,
            prepContext: prepNote,
