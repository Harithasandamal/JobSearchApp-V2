import defaultResume from '../assets/Default Resume.pdf';

/**
 * Extract resume content from file or use default
 * @param {Object} resumeFile - Resume file object with name, file, and isDefault properties
 * @returns {Promise<Object>} - Resume data object with content and fileName
 */
export const extractResumeContent = async (resumeFile) => {
  try {
    // If no resume file, use default
    if (!resumeFile || !resumeFile.name) {
      return {
        content: 'Default resume content for analysis. This is a placeholder for the default resume.',
        fileName: 'Default Resume.pdf'
      };
    }

    // If it's a default resume, use placeholder content
    if (resumeFile.isDefault) {
      return {
        content: `Default Resume Content:
        
EDUCATION:
- Bachelor's Degree in Computer Science
- Relevant certifications and training

EXPERIENCE:
- 3+ years of software development experience
- Experience with modern web technologies
- Project management and team collaboration

SKILLS:
- Programming languages: JavaScript, Python, Java
- Web technologies: React, Node.js, HTML, CSS
- Database: SQL, MongoDB
- Tools: Git, Docker, AWS

OTHER REQUIREMENTS:
- Australian work rights
- Driver's license
- Available for immediate start`,
        fileName: resumeFile.name
      };
    }

    // If it's an uploaded file, try to extract text content
    if (resumeFile.file) {
      try {
        // For PDF files, we'll use a simple text extraction
        // In a real implementation, you might want to use a PDF parsing library
        const textContent = await extractTextFromFile(resumeFile.file);
        return {
          content: textContent,
          fileName: resumeFile.name
        };
      } catch (error) {
        console.error('Error extracting text from file:', error);
        // Fallback to a generic content based on file name
        return {
          content: `Resume content for ${resumeFile.name}. This is a placeholder as text extraction failed.`,
          fileName: resumeFile.name
        };
      }
    }

    // Fallback for any other case
    return {
      content: `Resume content for ${resumeFile.name}. This is a placeholder.`,
      fileName: resumeFile.name
    };

  } catch (error) {
    console.error('Error extracting resume content:', error);
    return {
      content: 'Error extracting resume content. Using default placeholder.',
      fileName: resumeFile?.name || 'Unknown Resume'
    };
  }
};

/**
 * Extract text content from a file
 * @param {File} file - File object
 * @returns {Promise<string>} - Extracted text content
 */
const extractTextFromFile = async (file) => {
  return new Promise((resolve, reject) => {
    // For now, we'll use a simple approach
    // In a production environment, you might want to use libraries like pdf-parse for PDFs
    if (file.type === 'application/pdf') {
      // For PDF files, we'll return a placeholder
      // In a real implementation, you would use a PDF parsing library
      resolve(`PDF Resume Content for ${file.name}:
      
This is a placeholder for PDF content extraction. In a real implementation, 
this would contain the actual text content extracted from the PDF file.

The content would include:
- Education and qualifications
- Work experience and achievements
- Skills and competencies
- Certifications and licenses
- Other relevant information`);
    } else if (file.type === 'text/plain') {
      // For text files, read the content
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    } else {
      // For other file types, return a placeholder
      resolve(`Resume content for ${file.name} (${file.type}):
      
This is a placeholder for file content extraction. The actual content would 
be extracted based on the file type and format.`);
    }
  });
};

/**
 * Get resume summary for display
 * @param {Object} resumeFile - Resume file object
 * @returns {string} - Resume summary
 */
export const getResumeSummary = (resumeFile) => {
  if (!resumeFile || !resumeFile.name) {
    return 'No resume uploaded';
  }
  
  if (resumeFile.isDefault) {
    return 'Default Resume (Shamalka Resume v2.pdf)';
  }
  
  return `Uploaded: ${resumeFile.name}`;
}; 