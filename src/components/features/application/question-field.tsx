import { CountryQuestion } from "@/components/features/application/country";
import { DropdownQuestion } from "@/components/features/application/dropdown";
import { FullLegalNameQuestion } from "@/components/features/application/full-legal-name";
import { LongAnswerQuestion } from "@/components/features/application/long-answer";
import { MajorQuestion } from "@/components/features/application/major";
import { MultipleChoiceQuestion } from "@/components/features/application/multiple-choice";
import { PortfolioQuestion } from "@/components/features/application/portfolio";
import { SchoolQuestion } from "@/components/features/application/school";
import { SelectAllQuestion } from "@/components/features/application/select-all";
import { ShortAnswerQuestion } from "@/components/features/application/short-answer";
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
      // Unknown question type; render nothing.
      return null;
  }
}
