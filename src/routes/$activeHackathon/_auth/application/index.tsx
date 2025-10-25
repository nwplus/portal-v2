import { Input } from "@/components/ui/input";
import { useHackathonInfo } from "@/hooks/use-hackathon-info";
import { useApplicantStore } from "@/lib/stores/applicant-store";
import { useApplicationQuestionStore } from "@/lib/stores/application-question-store";
import { createFileRoute } from "@tanstack/react-router";
import { useId } from "react";

export const Route = createFileRoute("/$activeHackathon/_auth/application/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { dbCollectionName } = useHackathonInfo();
  const welcome = useApplicationQuestionStore((s) => s.welcome);
  const applicantDraft = useApplicantStore((s) => s.applicantDraft);
  const patchApplicant = useApplicantStore((s) => s.patchApplicant);
  const idPrefix = useId();
  const ids = {
    basicEmail: `${idPrefix}-basic-email`,
    basicPhone: `${idPrefix}-basic-phone`,
    basicFirstName: `${idPrefix}-basic-first-name`,
    basicLastName: `${idPrefix}-basic-last-name`,
    basicPreferredName: `${idPrefix}-basic-preferred-name`,
    basicGender: `${idPrefix}-basic-gender`,
    basicGraduation: `${idPrefix}-basic-graduation`,
    basicCountry: `${idPrefix}-basic-country`,
    basicEducation: `${idPrefix}-basic-education`,
    basicMajor: `${idPrefix}-basic-major`,
    basicSchool: `${idPrefix}-basic-school`,
    basicIsOfLegalAge: `${idPrefix}-basic-is-of-legal-age`,
    questionnaireEngagement: `${idPrefix}-questionnaire-engagement`,
    questionnaireFriendEmail: `${idPrefix}-questionnaire-friend-email`,
    questionnaireOther: `${idPrefix}-questionnaire-other`,
    questionnaireEvents: `${idPrefix}-questionnaire-events`,
    skillsGithub: `${idPrefix}-skills-github`,
    skillsLinkedin: `${idPrefix}-skills-linkedin`,
    skillsPortfolio: `${idPrefix}-skills-portfolio`,
    skillsResume: `${idPrefix}-skills-resume`,
    skillsNumHackathons: `${idPrefix}-skills-num-hackathons`,
    skillsContribution: `${idPrefix}-skills-contribution`,
    statusApplication: `${idPrefix}-status-application`,
    statusAttending: `${idPrefix}-status-attending`,
    statusResponded: `${idPrefix}-status-responded`,
    submissionSubmitted: `${idPrefix}-submission-submitted`,
  } as const;

  if (!welcome) {
    return <div>No welcome message yet.</div>;
  }

  if (!applicantDraft) {
    return <div>Loading application…</div>;
  }

  const basicInfo = applicantDraft.basicInfo ?? {};
  const questionnaire = applicantDraft.questionnaire ?? {};
  const skills = applicantDraft.skills ?? {};
  const status = applicantDraft.status ?? {};
  const submission = applicantDraft.submission ?? {};
  const terms = applicantDraft.termsAndConditions ?? {};

  const culturalBackground = basicInfo.culturalBackground ?? {};
  const dietaryRestriction = basicInfo.dietaryRestriction ?? {};

  const handleNumberChange = (value: string, onChange: (next: number | undefined) => void) => {
    const parsed = Number(value);
    if (!value) {
      onChange(undefined);
      return;
    }
    onChange(Number.isNaN(parsed) ? undefined : parsed);
  };

  const handleCommaListChange = (value: string, onChange: (next: string[]) => void) => {
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    onChange(items);
  };

  return (
    <section className="space-y-6">
      <h1 className="font-semibold text-2xl">{welcome.title ?? "Welcome"}</h1>
      {welcome.content ? (
        <p className="whitespace-pre-line text-muted-foreground">{welcome.content}</p>
      ) : null}
      {welcome.description ? (
        <p className="text-muted-foreground text-sm">{welcome.description}</p>
      ) : null}
      <form className="space-y-8">
        <fieldset className="space-y-4">
          <legend className="font-semibold text-lg">Basic Info</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicEmail}>Email</label>
              <Input
                id={ids.basicEmail}
                value={basicInfo.email ?? ""}
                onChange={(event) => patchApplicant({ basicInfo: { email: event.target.value } })}
                type="email"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicPhone}>Phone Number</label>
              <Input
                id={ids.basicPhone}
                value={basicInfo.phoneNumber ?? ""}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { phoneNumber: event.target.value } })
                }
                placeholder="+1 XXX-XXX-XXXX"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicFirstName}>Legal First Name</label>
              <Input
                id={ids.basicFirstName}
                value={basicInfo.legalFirstName ?? ""}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { legalFirstName: event.target.value } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicLastName}>Legal Last Name</label>
              <Input
                id={ids.basicLastName}
                value={basicInfo.legalLastName ?? ""}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { legalLastName: event.target.value } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicPreferredName}>Preferred Name</label>
              <Input
                id={ids.basicPreferredName}
                value={basicInfo.preferredName ?? ""}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { preferredName: event.target.value } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicGender}>Gender</label>
              <Input
                id={ids.basicGender}
                value={typeof basicInfo.gender === "string" ? basicInfo.gender : ""}
                onChange={(event) => patchApplicant({ basicInfo: { gender: event.target.value } })}
                placeholder="Enter gender or leave blank"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicGraduation}>Graduation Year</label>
              <Input
                id={ids.basicGraduation}
                value={basicInfo.graduation?.toString() ?? ""}
                onChange={(event) =>
                  handleNumberChange(event.target.value, (next) =>
                    patchApplicant({ basicInfo: { graduation: next } }),
                  )
                }
                inputMode="numeric"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicCountry}>Country of Residence</label>
              <Input
                id={ids.basicCountry}
                value={basicInfo.countryOfResidence ?? ""}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { countryOfResidence: event.target.value } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicEducation}>Education Level</label>
              <Input
                id={ids.basicEducation}
                value={basicInfo.educationLevel ?? ""}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { educationLevel: event.target.value as never } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.basicMajor}>Major</label>
              <Input
                id={ids.basicMajor}
                value={typeof basicInfo.major === "string" ? basicInfo.major : ""}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { major: event.target.value as never } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm md:col-span-2">
              <label htmlFor={ids.basicSchool}>School</label>
              <Input
                id={ids.basicSchool}
                value={basicInfo.school ?? ""}
                onChange={(event) => patchApplicant({ basicInfo: { school: event.target.value } })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm" htmlFor={ids.basicIsOfLegalAge}>
              <input
                id={ids.basicIsOfLegalAge}
                type="checkbox"
                checked={basicInfo.isOfLegalAge ?? false}
                onChange={(event) =>
                  patchApplicant({ basicInfo: { isOfLegalAge: event.target.checked } })
                }
                className="size-4"
              />
              <span>Is of legal age</span>
            </label>

            <div className="space-y-2">
              <p className="font-medium text-sm">Cultural Background</p>
              <div className="grid gap-2 md:grid-cols-2">
                {(
                  [
                    "asian",
                    "black",
                    "caucasian",
                    "hispanic",
                    "middleEastern",
                    "nativeHawaiian",
                    "northAmerica",
                    "other",
                    "preferNot",
                  ] as const
                ).map((key) => {
                  const checkboxId = `${idPrefix}-basic-cultural-${key}`;
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm"
                      htmlFor={checkboxId}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        className="size-4"
                        checked={Boolean(culturalBackground[key])}
                        onChange={(event) =>
                          patchApplicant({
                            basicInfo: {
                              culturalBackground: {
                                [key]: event.target.checked,
                              },
                            },
                          })
                        }
                      />
                      <span>{key}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Dietary Restriction</p>
              <div className="grid gap-2 md:grid-cols-2">
                {(
                  [
                    "celiacDisease",
                    "halal",
                    "kosher",
                    "none",
                    "other",
                    "vegan",
                    "vegetarian",
                  ] as const
                ).map((key) => {
                  const checkboxId = `${idPrefix}-basic-dietary-${key}`;
                  return (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-sm"
                      htmlFor={checkboxId}
                    >
                      <input
                        id={checkboxId}
                        type="checkbox"
                        className="size-4"
                        checked={Boolean(dietaryRestriction[key])}
                        onChange={(event) =>
                          patchApplicant({
                            basicInfo: {
                              dietaryRestriction: {
                                [key]: event.target.checked,
                              },
                            },
                          })
                        }
                      />
                      <span>{key}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-lg">Questionnaire</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.questionnaireEngagement}>Engagement Source</label>
              <Input
                id={ids.questionnaireEngagement}
                value={
                  typeof questionnaire.engagementSource === "string"
                    ? questionnaire.engagementSource
                    : ""
                }
                onChange={(event) =>
                  patchApplicant({ questionnaire: { engagementSource: event.target.value } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.questionnaireFriendEmail}>Friend Email</label>
              <Input
                id={ids.questionnaireFriendEmail}
                value={questionnaire.friendEmail ?? ""}
                onChange={(event) =>
                  patchApplicant({ questionnaire: { friendEmail: event.target.value } })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.questionnaireOther}>Other Engagement Source</label>
              <Input
                id={ids.questionnaireOther}
                value={questionnaire.otherEngagementSource ?? ""}
                onChange={(event) =>
                  patchApplicant({
                    questionnaire: { otherEngagementSource: event.target.value },
                  })
                }
              />
            </div>
            <div className="flex flex-col gap-2 text-sm md:col-span-2">
              <label htmlFor={ids.questionnaireEvents}>Events Attended (comma separated)</label>
              <Input
                id={ids.questionnaireEvents}
                value={(questionnaire.eventsAttended ?? []).join(", ")}
                onChange={(event) =>
                  handleCommaListChange(event.target.value, (next) =>
                    patchApplicant({ questionnaire: { eventsAttended: next } }),
                  )
                }
              />
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-lg">Skills</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.skillsGithub}>Github</label>
              <Input
                id={ids.skillsGithub}
                value={skills.github ?? ""}
                onChange={(event) => patchApplicant({ skills: { github: event.target.value } })}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.skillsLinkedin}>LinkedIn</label>
              <Input
                id={ids.skillsLinkedin}
                value={skills.linkedin ?? ""}
                onChange={(event) => patchApplicant({ skills: { linkedin: event.target.value } })}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.skillsPortfolio}>Portfolio</label>
              <Input
                id={ids.skillsPortfolio}
                value={skills.portfolio ?? ""}
                onChange={(event) => patchApplicant({ skills: { portfolio: event.target.value } })}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.skillsResume}>Resume URL</label>
              <Input
                id={ids.skillsResume}
                value={skills.resume ?? ""}
                onChange={(event) => patchApplicant({ skills: { resume: event.target.value } })}
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.skillsNumHackathons}>Number of Hackathons Attended</label>
              <Input
                id={ids.skillsNumHackathons}
                value={skills.numHackathonsAttended?.toString() ?? ""}
                onChange={(event) =>
                  handleNumberChange(event.target.value, (next) =>
                    patchApplicant({ skills: { numHackathonsAttended: next } }),
                  )
                }
                inputMode="numeric"
              />
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.skillsContribution}>Contribution Role</label>
              <Input
                id={ids.skillsContribution}
                value={JSON.stringify(skills.contributionRole ?? {})}
                onChange={(event) => {
                  try {
                    const parsed = JSON.parse(event.target.value) as Record<string, boolean>;
                    patchApplicant({ skills: { contributionRole: parsed } });
                  } catch {
                    patchApplicant({ skills: { contributionRole: undefined } });
                  }
                }}
                placeholder="JSON object"
              />
            </div>
          </div>
          <div className="grid gap-4">
            {([1, 2, 3, 4, 5] as const).map((idx) => {
              const answerId = `${idPrefix}-skills-long-answer-${idx}`;
              return (
                <div key={idx} className="flex flex-col gap-2 text-sm">
                  <label htmlFor={answerId}>Long Answer {idx}</label>
                  <textarea
                    id={answerId}
                    value={skills[`longAnswers${idx}` as const] ?? ""}
                    onChange={(event) =>
                      patchApplicant({
                        skills: { [`longAnswers${idx}` as const]: event.target.value },
                      })
                    }
                    className="min-h-24 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                </div>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-lg">Status</legend>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2 text-sm">
              <label htmlFor={ids.statusApplication}>Application Status</label>
              <Input
                id={ids.statusApplication}
                value={status.applicationStatus ?? ""}
                onChange={(event) =>
                  patchApplicant({ status: { applicationStatus: event.target.value as never } })
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm" htmlFor={ids.statusAttending}>
              <input
                id={ids.statusAttending}
                type="checkbox"
                className="size-4"
                checked={status.attending ?? false}
                onChange={(event) =>
                  patchApplicant({ status: { attending: event.target.checked } })
                }
              />
              <span>Attending</span>
            </label>
            <label className="flex items-center gap-2 text-sm" htmlFor={ids.statusResponded}>
              <input
                id={ids.statusResponded}
                type="checkbox"
                className="size-4"
                checked={status.responded ?? false}
                onChange={(event) =>
                  patchApplicant({ status: { responded: event.target.checked } })
                }
              />
              <span>Responded</span>
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-lg">Submission</legend>
          <label className="flex items-center gap-2 text-sm" htmlFor={ids.submissionSubmitted}>
            <input
              id={ids.submissionSubmitted}
              type="checkbox"
              className="size-4"
              checked={submission.submitted ?? false}
              onChange={(event) =>
                patchApplicant({ submission: { submitted: event.target.checked } })
              }
            />
            <span>Submitted</span>
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="font-semibold text-lg">Terms and Conditions</legend>
          <div className="grid gap-2 md:grid-cols-2">
            {(
              [
                "MLHCodeOfConduct",
                "MLHEmailSubscription",
                "MLHPrivacyPolicy",
                "nwPlusPrivacyPolicy",
                "shareWithSponsors",
                "shareWithnwPlus",
              ] as const
            ).map((key) => {
              const checkboxId = `${idPrefix}-terms-${key}`;
              return (
                <label key={key} className="flex items-center gap-2 text-sm" htmlFor={checkboxId}>
                  <input
                    id={checkboxId}
                    type="checkbox"
                    className="size-4"
                    checked={Boolean(terms[key])}
                    onChange={(event) =>
                      patchApplicant({
                        termsAndConditions: {
                          [key]: event.target.checked,
                        },
                      })
                    }
                  />
                  <span>{key}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="rounded-md border bg-muted/40 p-4 text-sm">
          <p>
            Active Hackathon: <strong>{dbCollectionName}</strong>
          </p>
          <p>
            Applicant ID: <strong>{applicantDraft._id}</strong>
          </p>
        </div>
      </form>
    </section>
  );
}
