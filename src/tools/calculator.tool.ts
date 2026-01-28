import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import * as math from 'mathjs';

/**
 * Calculator tool for performing mathematical operations.
 * Uses mathjs for evaluation.
 */
export const calculatorTool = new DynamicStructuredTool({
  name: 'calculator',
  description: 'Perform mathematical calculations. Supports basic arithmetic, percentages, square roots, trigonometry, and unit conversions.',
  schema: z.object({
    expression: z.string().describe('The mathematical expression to evaluate, e.g., "2 + 2", "sqrt(16)", "15% of 200", "5 km to miles"')
  }),
  func: async ({ expression }) => {
    try {
      const result = math.evaluate(expression);
      return `Result: ${result}`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return `Error evaluating expression: ${errorMessage}`;
    }
  }
});
