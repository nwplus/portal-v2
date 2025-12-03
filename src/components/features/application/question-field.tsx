import { CountryQuestion } from "@/components/features/application/country-question";
import { DropdownQuestion } from "@/components/features/application/dropdown-question";
import { FullLegalNameQuestion } from "@/components/features/application/full-legal-name-question";
import { LongAnswerQuestion } from "@/components/features/application/long-answer-question";
import { MajorQuestion } from "@/components/features/application/major-question";
import { MultipleChoiceQuestion } from "@/components/features/application/multiple-choice-question";
import { PortfolioQuestion } from "@/components/features/application/portfolio-question";
import { SchoolQuestion } from "@/components/features/application/school-question";
import { SelectAllQuestion } from "@/components/features/application/select-all-question";
import { ShortAnswerQuestion } from "@/components/features/application/short-answer-question";
import type {
  HackerApplicationNonWelcomeQuestion,
  HackerApplicationSections,
} from "@/lib/firebase/types/hacker-app-questions";

export interface QuestionFieldProps {
  section: HackerApplicationSections;
  question: HackerApplicationNonWelcomeQuestion;
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
    case "School":
      return <SchoolQuestion {...props} />;
    case "Major":
      return <MajorQuestion {...props} />;
    case "Country":
      return <CountryQuestion {...props} />;
    case "Full Legal Name":
      return <FullLegalNameQuestion {...props} />;
    default:
      console.error(`Unknown question type: ${question.type}`);
      return null;
  }
}
