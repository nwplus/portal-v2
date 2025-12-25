import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FAQ } from "@/lib/firebase/types";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: Array<NonNullable<FAQ["category"]>> = [
  "General",
  "Teams & Projects",
  "Logistics",
  "Rewards",
];
const FALLBACK_CATEGORY = "Other";

export function FAQGrid({
  faqs,
  search,
}: {
  faqs: (FAQ & { _id: string })[] | null;
  search: string;
}) {
  const normalizedSearch = search.trim().toLowerCase();

  const matchesSearch = (faq: FAQ & { _id: string }) => {
    if (!normalizedSearch.length) return true;
    const questionText = faq.question?.toLowerCase() ?? "";
    const answerText = faq.answer?.toLowerCase() ?? "";
    return questionText.includes(normalizedSearch) || answerText.includes(normalizedSearch);
  };

  if (!faqs || !faqs.length) {
    return <p className="text-sm text-text-secondary">No FAQs available yet.</p>;
  }

  const groupedFaqs = faqs.reduce<Record<string, (FAQ & { _id: string })[]>>((acc, faq) => {
    const category = faq.category ?? FALLBACK_CATEGORY;
    acc[category] = acc[category] ? [...acc[category], faq] : [faq];
    return acc;
  }, {});

  const orderedCategories: string[] = [];

  for (const category of CATEGORY_ORDER) {
    if (groupedFaqs[category]?.length) {
      orderedCategories.push(category);
    }
  }

  for (const category of Object.keys(groupedFaqs)) {
    if (!CATEGORY_ORDER.includes(category as NonNullable<FAQ["category"]>)) {
      orderedCategories.push(category);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 text-text-primary md:grid-cols-2">
      {orderedCategories.map((category) => {
        const categoryFaqs = groupedFaqs[category] ?? [];
        const hasMatchInCategory = categoryFaqs.some(matchesSearch);

        return (
          <section key={category} className="flex flex-col gap-3">
            <h2
              className={cn(
                "text-xl",
                hasMatchInCategory ? "text-text-primary" : "text-text-secondary",
              )}
            >
              {category}
            </h2>
            <Accordion type="multiple">
              {categoryFaqs.map((faq) => {
                const isMatch = matchesSearch(faq);

                return (
                  <AccordionItem
                    key={faq._id}
                    value={faq._id}
                    className={!isMatch ? "opacity-60" : undefined}
                  >
                    <AccordionTrigger
                      className={cn(
                        isMatch ? "text-text-primary" : "text-text-secondary",
                        "cursor-pointer hover:no-underline hover:opacity-95",
                      )}
                    >
                      {faq.question ?? "Untitled question"}
                    </AccordionTrigger>
                    <AccordionContent
                      className={isMatch ? "text-text-primary" : "text-text-secondary"}
                    >
                      {faq.answer ?? "No answer provided."}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </section>
        );
      })}
    </div>
  );
}
