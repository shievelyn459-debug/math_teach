/**
 * Template Explanations Database 单元测试
 * Story 3-2: generate-knowledge-point-explanation
 * Task 3: Create template explanation database
 */

import {
  TEMPLATE_EXPLANATIONS,
  getTemplateExplanationByKnowledgePointId,
  getAllTemplateExplanations,
  validateTemplateExplanation,
} from '../explanations';
import {ExplanationSource, ExplanationSectionType} from '../../types/explanation';

describe('Template Explanations Database', () => {
  describe('TEMPLATE_EXPLANATIONS', () => {
    it('should have at least 6 template explanations', () => {
      expect(TEMPLATE_EXPLANATIONS.length).toBeGreaterThanOrEqual(6);
    });

    it('should have all required fields for each explanation', () => {
      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        expect(explanation.id).toBeDefined();
        expect(explanation.knowledgePointId).toBeDefined();
        expect(explanation.knowledgePointName).toBeDefined();
        expect(explanation.sections).toBeDefined();
        expect(explanation.teachingTips).toBeDefined();
        expect(explanation.source).toBe(ExplanationSource.TEMPLATE);
        expect(explanation.qualityScore).toBeGreaterThanOrEqual(0);
        expect(explanation.qualityScore).toBeLessThanOrEqual(1);
        expect(explanation.reviewed).toBe(true);
        expect(explanation.childAppropriate).toBe(true);
      });
    });

    it('should have all 4 section types for each explanation', () => {
      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        const sectionTypes = explanation.sections.map(s => s.type);
        expect(sectionTypes).toContain(ExplanationSectionType.DEFINITION);
        expect(sectionTypes).toContain(ExplanationSectionType.METHODS);
        expect(sectionTypes).toContain(ExplanationSectionType.EXAMPLES);
        expect(sectionTypes).toContain(ExplanationSectionType.TIPS);
      });
    });

    it('should have proper Chinese content for parents', () => {
      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        // 检查是否有内容
        expect(explanation.sections.length).toBeGreaterThan(0);

        // 检查章节内容是否为中文
        explanation.sections.forEach(section => {
          section.content.forEach(content => {
            // 检查是否包含中文字符
            expect(/[\u4e00-\u9fa5]/.test(content)).toBe(true);
          });
        });
      });
    });
  });

  describe('getTemplateExplanationByKnowledgePointId', () => {
    it('should return explanation for valid knowledge point ID', () => {
      const result = getTemplateExplanationByKnowledgePointId('kp-nr-001');
      expect(result).toBeDefined();
      expect(result?.knowledgePointId).toBe('kp-nr-001');
      expect(result?.knowledgePointName).toBe('10以内数的认识');
    });

    it('should return undefined for invalid knowledge point ID', () => {
      const result = getTemplateExplanationByKnowledgePointId('kp-invalid-999');
      expect(result).toBeUndefined();
    });

    it('should return explanation with all sections intact', () => {
      const result = getTemplateExplanationByKnowledgePointId('kp-add-001');
      expect(result).toBeDefined();
      expect(result?.sections).toHaveLength(4);
      expect(result?.teachingTips.length).toBeGreaterThan(0);
    });
  });

  describe('getAllTemplateExplanations', () => {
    it('should return all template explanations', () => {
      const all = getAllTemplateExplanations();
      expect(all).toEqual(TEMPLATE_EXPLANATIONS);
      expect(all.length).toBe(TEMPLATE_EXPLANATIONS.length);
    });

    it('should return a copy of the array', () => {
      const all = getAllTemplateExplanations();
      all.push({} as any);
      expect(getAllTemplateExplanations().length).toBe(TEMPLATE_EXPLANATIONS.length);
    });
  });

  describe('validateTemplateExplanation', () => {
    it('should pass validation for valid template explanation', () => {
      const validExplanation = TEMPLATE_EXPLANATIONS[0];
      const result = validateTemplateExplanation(validExplanation);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation for missing section', () => {
      const invalidExplanation = {
        ...TEMPLATE_EXPLANATIONS[0],
        sections: [
          {
            type: ExplanationSectionType.DEFINITION,
            title: 'Test',
            content: ['Test'],
            order: 1,
          },
        ],
      };
      const result = validateTemplateExplanation(invalidExplanation);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should fail validation for insufficient examples', () => {
      const invalidExplanation = {
        ...TEMPLATE_EXPLANATIONS[0],
        sections: TEMPLATE_EXPLANATIONS[0].sections.map(section => {
          if (section.type === ExplanationSectionType.EXAMPLES) {
            return {
              ...section,
              examples: [
                {
                  question: 'Test',
                  answer: 'Test',
                  steps: ['Test'],
                },
              ],
            };
          }
          return section;
        }),
      };
      const result = validateTemplateExplanation(invalidExplanation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('例题数量不足，至少需要3个例题');
    });

    it('should fail validation for insufficient teaching tips', () => {
      const invalidExplanation = {
        ...TEMPLATE_EXPLANATIONS[0],
        teachingTips: [
          {
            id: 'tip-001',
            title: 'Test',
            description: 'Test',
            dos: ['Test'],
            donts: ['Test'],
          },
        ],
      };
      const result = validateTemplateExplanation(invalidExplanation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('辅导技巧数量不足，至少需要2个技巧');
    });

    it('should fail validation for low quality score', () => {
      const invalidExplanation = {
        ...TEMPLATE_EXPLANATIONS[0],
        qualityScore: 0.7,
      };
      const result = validateTemplateExplanation(invalidExplanation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('质量分数过低: 0.7');
    });
  });

  describe('Content Quality Tests', () => {
    it('should avoid professional jargon in all explanations', () => {
      const jargonTerms = ['加数', '被加数', '被减数', '减数', '因数', '积'];

      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        explanation.sections.forEach(section => {
          section.content.forEach(content => {
            jargonTerms.forEach(term => {
              expect(content).not.toContain(term);
            });
          });
        });
      });
    });

    it('should use parent-friendly terms', () => {
      const friendlyTerms = ['孩子', '小朋友', '合起来', '拿走'];

      let foundFriendlyTerm = false;
      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        explanation.sections.forEach(section => {
          section.content.forEach(content => {
            friendlyTerms.forEach(term => {
              if (content.includes(term)) {
                foundFriendlyTerm = true;
              }
            });
          });
        });
      });

      expect(foundFriendlyTerm).toBe(true);
    });

    it('should include examples with step-by-step breakdown', () => {
      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        const examplesSection = explanation.sections.find(
          s => s.type === ExplanationSectionType.EXAMPLES
        );

        expect(examplesSection).toBeDefined();
        expect(examplesSection?.examples).toBeDefined();
        expect(examplesSection?.examples!.length).toBeGreaterThanOrEqual(3);

        examplesSection?.examples?.forEach(example => {
          expect(example.question).toBeDefined();
          expect(example.answer).toBeDefined();
          expect(example.steps).toBeDefined();
          expect(example.steps.length).toBeGreaterThan(0);
        });
      });
    });

    it('should include teaching tips with dos and donts', () => {
      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        expect(explanation.teachingTips.length).toBeGreaterThanOrEqual(2);

        explanation.teachingTips.forEach(tip => {
          expect(tip.id).toBeDefined();
          expect(tip.title).toBeDefined();
          expect(tip.description).toBeDefined();
          expect(tip.dos).toBeDefined();
          expect(tip.dos.length).toBeGreaterThan(0);
          expect(tip.donts).toBeDefined();
          expect(tip.donts.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have appropriate reading time estimates', () => {
      TEMPLATE_EXPLANATIONS.forEach(explanation => {
        expect(explanation.estimatedReadTime).toBeDefined();
        expect(explanation.estimatedReadTime).toBeGreaterThanOrEqual(3);
        expect(explanation.estimatedReadTime).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('Specific Knowledge Point Coverage', () => {
    it('should have template for number recognition (10以内)', () => {
      const exp = getTemplateExplanationByKnowledgePointId('kp-nr-001');
      expect(exp).toBeDefined();
      expect(exp?.knowledgePointName).toBe('10以内数的认识');
    });

    it('should have template for addition (10以内)', () => {
      const exp = getTemplateExplanationByKnowledgePointId('kp-add-001');
      expect(exp).toBeDefined();
      expect(exp?.knowledgePointName).toBe('10以内加法');
    });

    it('should have template for subtraction (10以内)', () => {
      const exp = getTemplateExplanationByKnowledgePointId('kp-sub-001');
      expect(exp).toBeDefined();
      expect(exp?.knowledgePointName).toBe('10以内减法');
    });

    it('should have template for carry addition (20以内)', () => {
      const exp = getTemplateExplanationByKnowledgePointId('kp-add-002');
      expect(exp).toBeDefined();
      expect(exp?.knowledgePointName).toBe('20以内进位加法');
    });

    it('should have template for word problems', () => {
      const exp = getTemplateExplanationByKnowledgePointId('kp-wp-001');
      expect(exp).toBeDefined();
      expect(exp?.knowledgePointName).toBe('简单应用题');
    });

    it('should have template for geometry', () => {
      const exp = getTemplateExplanationByKnowledgePointId('kp-geo-001');
      expect(exp).toBeDefined();
      expect(exp?.knowledgePointName).toBe('认识图形');
    });
  });
});
