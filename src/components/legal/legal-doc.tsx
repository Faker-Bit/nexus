import { Container, PageHeader } from "@/components/ui/section";
import { LEGAL_DOCS } from "@/content/legal";

/** Shared renderer for the legal documents (terms, privacy, licences, cookies). */
export function LegalDoc({ slug }: { slug: string }) {
  const doc = LEGAL_DOCS[slug];
  return (
    <Container className="pb-24">
      <PageHeader title={doc.title} description={doc.updated} />
      <div className="max-w-3xl space-y-8">
        {doc.sections.map((section) => (
          <section key={section.h}>
            <h2 className="text-[17px] font-semibold">{section.h}</h2>
            <div className="mt-3 space-y-3">
              {section.p.map((paragraph) => (
                <p key={paragraph.slice(0, 32)} className="text-[14px] leading-relaxed text-mist-300">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Container>
  );
}