case "chemistry": {
  const atomicStructurePattern =
    /atomic structure|atomic model|subatomic particles?|protons?|neutrons?|isotopes?|atomic number|mass number|electronic configuration|electron configuration|quantum numbers?|atomic orbitals/i;

  const structuralTopicPattern =
    /chemical bond|bonding|vsepr|molecular geometr|hybridis|hybridiz|molecular orbital|lewis structure|electron dot|bond angle|molecular polarity|intermolecular force/i;

  const isAtomicStructure = topics.some((topic) =>
    atomicStructurePattern.test(topic)
  );

  const isStructuralChemistry = topics.some((topic) =>
    structuralTopicPattern.test(topic)
  );

  if (isAtomicStructure) {
    const atomicFocus = formatTopicPhrase(topics, subject);

    items.push({
      id: 1,
      title: "Atomic Models & Subatomic Particles",
      category: "Atomic Fundamentals",
      discipline,
      disciplineLabel,
      description: `Revise the atomic models and subatomic particles covered in ${atomicFocus}. Explain the roles, relative charges, and locations of protons, neutrons, and electrons.`,
      actionableStep: `Draw and label an atomic model, then answer 5 recall questions on the properties, charges, and locations of subatomic particles in ${atomicFocus}.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 2,
      title: "Atomic Number, Mass Number & Isotopes",
      category: "Atomic Calculations",
      discipline,
      disciplineLabel,
      description: `Practise interpreting atomic number, mass number, isotopes, and particle counts for ${atomicFocus}. Distinguish neutral atoms from ions where relevant.`,
      actionableStep: `Solve 5 questions involving proton, neutron, and electron counts, isotope notation, and atomic or mass numbers. Check every answer against your notes.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 3,
      title: "Electronic Configuration & Valence Electrons",
      category: "Electron Arrangement",
      discipline,
      disciplineLabel,
      description: `Revise electron arrangements and electronic configurations relevant to ${atomicFocus}, following the notation and filling rules required by your syllabus.`,
      actionableStep: `Write electronic configurations for 5 syllabus-relevant atoms or ions and identify their valence electrons. Correct any errors using your notes.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 4,
      title: "Orbitals & Quantum Numbers",
      category: "Atomic Orbitals",
      discipline,
      disciplineLabel,
      description: `Study orbital types, energy levels, and quantum numbers where they are included in your ${atomicFocus} syllabus. Connect orbital notation to electron arrangement.`,
      actionableStep: `Practise 3 syllabus-relevant questions on orbital notation, quantum numbers, or electron arrangements. Skip quantum-number content if it is outside your syllabus.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 5,
      title: "Atomic Structure Exam Practice",
      category: "Exam Calibration",
      discipline,
      disciplineLabel,
      description: `Test your understanding of ${atomicFocus} using exam-style questions covering definitions, particle counts, isotope notation, and electronic configuration where applicable.`,
      actionableStep: `Complete 5 exam-style questions on ${atomicFocus} under timed conditions. Check the answers, correct mistakes, and record concepts that need another review.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });
  } else if (isStructuralChemistry) {
    const structuralFocus = formatTopicPhrase(topics, subject);

    items.push({
      id: 1,
      title: "Lewis Structures, Valence Electrons & Formal Charge",
      category: "Electron-Dot Structures",
      discipline,
      disciplineLabel,
      description: `Build Lewis electron-dot structures specifically for ${structuralFocus}, showing valence electrons, bonding pairs, lone pairs, octet-rule exceptions where relevant, and formal charges.`,
      actionableStep: `Draw Lewis structures from memory for 3 representative species connected to ${structuralFocus}; check electron counts, formal charges, and any resonance structures against your notes.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 2,
      title: "VSEPR Shapes & Bond-Angle Predictions",
      category: "Molecular Geometry",
      discipline,
      disciplineLabel,
      description: `Apply VSEPR theory to the molecules relevant to ${structuralFocus}. Count electron domains, distinguish bonding pairs from lone pairs, and predict electron-domain geometry, molecular shape, and approximate bond angles.`,
      actionableStep: `Complete a table for 4 representative molecules: Lewis structure, number of electron domains, lone pairs on the central atom, molecular shape, approximate bond angle, and whether the molecule is polar.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 3,
      title: "Hybridisation & Sigma/Pi Bond Analysis",
      category: "Orbital Overlap",
      discipline,
      disciplineLabel,
      description: `Connect ${structuralFocus} to orbital arrangement where applicable: identify the central atom's hybridisation, distinguish sigma and pi bonds, and relate orbital overlap to molecular geometry without introducing unrelated reaction calculations.`,
      actionableStep: `For 3 relevant molecules or species, identify the central atom's hybridisation, count sigma and pi bonds, and explain how the orbital arrangement supports the predicted shape.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 4,
      title: "Molecular Orbital Diagrams & Bond Order",
      category: "Molecular Orbital Theory",
      discipline,
      disciplineLabel,
      description: `For the molecular-orbital portion of ${structuralFocus}, fill the appropriate orbital energy diagram, count bonding and antibonding electrons, calculate bond order, and determine magnetic behaviour when the species and syllabus require it.`,
      actionableStep: `Draw and label molecular-orbital diagrams for 2 syllabus-relevant diatomic species; calculate each bond order and state whether it is paramagnetic or diamagnetic, explaining the electron configuration.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 5,
      title: "Polarity, Bonding Types & Exam-Style Retrieval",
      category: "Structure and Explanation",
      discipline,
      disciplineLabel,
      description: `Compare ionic, covalent, coordinate, and hydrogen bonding only where relevant to ${structuralFocus}; use electronegativity, molecular symmetry, and dipole vectors to distinguish bond polarity from overall molecular polarity.`,
      actionableStep: `Answer 2 exam-style questions on ${structuralFocus}. In each answer, show the electron or geometry reasoning, use precise chemical terminology, and check your explanation against your syllabus or mark scheme.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });
  } else {
    items.push({
      id: 1,
      title: "Balanced Chemical Equations & Mechanisms",
      category: "Reaction Mechanisms",
      discipline,
      disciplineLabel,
      description: `Write out and balance every primary equation ${
        hasExplicitTopics
          ? `for ${topicPhrase} in ${subject}`
          : `across your ${subject} syllabus`
      }, ensuring correct state symbols, ionic charges, and electron movement or curly arrows.`,
      actionableStep: `Write out 5 essential balanced equations or reaction mechanisms ${
        hasExplicitTopics
          ? `for ${primaryTopic} in ${subject}`
          : `in ${subject}`
      } from memory.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 2,
      title: "Periodic Trends & Molecular Geometry",
      category: "Structural Chemistry",
      discipline,
      disciplineLabel,
      description: `Map out the molecular structures, bonding types (ionic, covalent, metallic, hydrogen bonding), and periodic trends governing ${
        hasExplicitTopics
          ? `${topicPhrase} in ${subject}`
          : `your ${subject} syllabus`
      }.`,
      actionableStep: `Sketch the 3D geometry or electron dot structures for key molecules ${
        hasExplicitTopics
          ? `in ${primaryTopic} (${subject})`
          : `in ${subject}`
      }, indicating bond angles and dipoles.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 3,
      title: "Stoichiometry & Quantitative Calculations",
      category: "Quantitative Chemistry",
      discipline,
      disciplineLabel,
      description: `Work through 3 quantitative calculations ${
        hasExplicitTopics
          ? `for ${topicPhrase} in ${subject}`
          : `in ${subject}`
      } (such as mole ratios, molar concentrations, yield, equilibrium constants, or enthalpy changes) checking significant figures.`,
      actionableStep: `Calculate the quantitative yield or equilibrium concentrations for a representative problem ${
        hasExplicitTopics
          ? `in ${primaryTopic} (${subject})`
          : `in ${subject}`
      }.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 4,
      title: "Reagents, Catalysts & Reaction Conditions",
      category: "Reaction Conditions",
      discipline,
      disciplineLabel,
      description: `Test your recall of exact conditions (temperature, pressure, catalyst, acid/base medium) required for transformations ${
        hasExplicitTopics
          ? `in ${topicPhrase} (${subject})`
          : `in ${subject}`
      }.`,
      actionableStep: `Build a quick reference flash table linking each reaction ${
        hasExplicitTopics
          ? `in ${topicPhrase} (${subject})`
          : `in ${subject}`
      } to its specific catalyst, temperature, and solvent.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });

    items.push({
      id: 5,
      title: "Mark-Scheme Diagnostic Practice",
      category: "Exam Calibration",
      discipline,
      disciplineLabel,
      description: `Solve 2 multi-part past paper questions ${
        hasExplicitTopics
          ? `on ${topicPhrase} in ${subject}`
          : `in ${subject}`
      } and verify against official mark schemes to calibrate your explanation depth and required technical terms.`,
      actionableStep: `Review the official marking points for a past question ${
        hasExplicitTopics
          ? `on ${primaryTopic} (${subject})`
          : `in ${subject}`
      } to ensure no essential keywords are skipped.`,
      timeContext: timeNote,
      prepContext: prepNote,
    });
  }

  break;
}
