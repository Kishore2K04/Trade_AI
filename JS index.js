const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// AI recommendation system for career paths based on user inputs
exports.getCareerRecommendations = functions.https.onCall(async (data, context) => {
  try {
    // Optional: Add authentication check if required
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    const { education, skills, interests, experience } = data;
    
    // Input validation to prevent silent failures
    if (!education || !skills || !interests || !experience) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required inputs: education, skills, interests, experience');
    }
    if (!Array.isArray(skills) || !Array.isArray(interests) || !Array.isArray(experience)) {
      throw new functions.https.HttpsError('invalid-argument', 'skills, interests, and experience must be arrays');
    }
    
    // Fetch careers and skills once outside the loop for efficiency
    const [careersSnapshot, skillsSnapshot] = await Promise.all([
      admin.firestore().collection('careers').get(),
      admin.firestore().collection('skills').get()
    ]);
    
    const careers = {};
    careersSnapshot.forEach(doc => {
      careers[doc.id] = doc.data();
    });
    
    const allSkills = {};
    skillsSnapshot.forEach(doc => {
      allSkills[doc.id] = doc.data();
    });
    
    // Simple scoring algorithm based on user inputs
    const scoredCareers = Object.keys(careers).map(careerId => {
      const career = careers[careerId];
      let score = 0;
      
      // Match by interests/tags
      const matchingTags = career.tags.filter(tag => 
        interests.some(interest => interest.toLowerCase() === tag.toLowerCase())
      );
      score += matchingTags.length * 2; // Higher weight for interest matches
      
      // Match by skills (assuming skills are IDs in Firestore; adjust if they are strings)
      const userSkillsMatchingCareer = skills.filter(userSkill => 
        career.skills.some(careerSkill => {
          const skillData = allSkills[careerSkill];
          // Assuming careerSkill is an ID, and skillData has a 'name' field
          return skillData && skillData.name.toLowerCase() === userSkill.toLowerCase();
        })
      );
      score += userSkillsMatchingCareer.length;
      
      // Education level consideration (improved logic)
      const educationLevels = {
        'high_school': 1,
        'some_college': 2,
        'associate': 3,
        'bachelor': 4,
        'master': 5,
        'phd': 6
      };
      
      const userEducationLevel = educationLevels[education] || 1;
      
      // Check if career requires higher education (more robust check)
      const requiresDegree = career.education.some(edu => 
        edu.toLowerCase().includes('degree') || edu.toLowerCase().includes('bachelor') || edu.toLowerCase().includes('master')
      );
      
      if (requiresDegree && userEducationLevel >= 3) {
        score += 1; // Bonus for having appropriate education
      } else if (!requiresDegree && userEducationLevel <= 2) {
        score += 1; // Trades often don't require degrees
      }
      
      // Work experience consideration (refined for accuracy)
      const hasRelevantExperience = experience.some(exp => 
        career.tags.some(tag => exp.toLowerCase().includes(tag.toLowerCase()))
      );
      
      if (hasRelevantExperience) {
        score += 2;
      }
      
      return {
        id: careerId,
        ...career,
        score
      };
    });
    
    // Sort careers by score (descending)
    const recommendations = scoredCareers.sort((a, b) => b.score - a.score);
    
    return {
      success: true,
      recommendations
    };
  } catch (error) {
    console.error('Error generating career recommendations:', error);
    return {
      success: false,
      error: 'Failed to generate recommendations',
      details: error.message
    };
  }
});

// Fallback function to get all careers when user skips personalization
exports.getAllCareers = functions.https.onCall(async (data, context) => {
  try {
    // Optional: Add authentication check if required
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    const careersSnapshot = await admin.firestore().collection('careers').get();
    const careers = [];
    
    careersSnapshot.forEach(doc => {
      careers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      success: true,
      careers
    };
  } catch (error) {
    console.error('Error fetching all careers:', error);
    return {
      success: false,
      error: 'Failed to fetch careers',
      details: error.message
    };
  }
});

// Function to get skills with learning resources
exports.getSkillsWithResources = functions.https.onCall(async (data, context) => {
  try {
    // Optional: Add authentication check if required
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    // }

    const { careerIds } = data;
    
    // Input validation
    if (careerIds && !Array.isArray(careerIds)) {
      throw new functions.https.HttpsError('invalid-argument', 'careerIds must be an array');
    }
    
    // Get all skills from Firestore
    const skillsSnapshot = await admin.firestore().collection('skills').get();
    const allSkills = {};
    
    skillsSnapshot.forEach(doc => {
      allSkills[doc.id] = {
        id: doc.id,
        ...doc.data()
      };
    });
    
    // Filter skills by career if careerIds provided
    let relevantSkills = Object.values(allSkills);
    
    if (careerIds && careerIds.length > 0) {
      relevantSkills = relevantSkills.filter(skill => 
        skill.linkedCareers && Array.isArray(skill.linkedCareers) && 
        skill.linkedCareers.some(careerId => careerIds.includes(careerId))
      );
    }
    
    return {
      success: true,
      skills: relevantSkills
    };
  } catch (error) {
    console.error('Error fetching skills with resources:', error);
    return {
      success: false,
      error: 'Failed to fetch skills',
      details: error.message
    };
  }
});
