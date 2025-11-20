import { DropdownQuestion } from "@/components/features/application/dropdown-question";
import { FullLegalNameQuestion } from "@/components/features/application/full-legal-name-question";
import { LongAnswerQuestion } from "@/components/features/application/long-answer-question";
import { MultipleChoiceQuestion } from "@/components/features/application/multiple-choice-question";
import { PortfolioQuestion } from "@/components/features/application/portfolio-question";
import { SelectAllQuestion } from "@/components/features/application/select-all-question";
import { ShortAnswerQuestion } from "@/components/features/application/short-answer-question";
import type {
  HackerApplicationQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";

export interface QuestionFieldProps {
  section: HackerApplicationSections;
  question: HackerApplicationQuestion;
}

/**
 * Renders a single application question, delegating to a per-type component.
 *
 * The per-type components use useQuestionFieldConfig to derive dynamic paths,
 * IDs, and errors from Firestore metadata + ApplicationFormValues.
 */
export function QuestionField(props: QuestionFieldProps) {
  const { question } = props;

  switch (question.type) {
    case "Short Answer":
      return <ShortAnswerQuestion {...props} />;
    case "Long Answer":
      return <LongAnswerQuestion {...props} />;
    case "Select All":
      return <SelectAllQuestion {...props} />;
    case "Multiple Choice":
      return <MultipleChoiceQuestion {...props} />;
    case "Dropdown":
      return <DropdownQuestion {...props} />;
    case "Portfolio":
      return <PortfolioQuestion {...props} />;
    case "Full Legal Name":
      return <FullLegalNameQuestion {...props} />;
    default:
      // Unknown question type; render nothing.
      return null;
  }
}
