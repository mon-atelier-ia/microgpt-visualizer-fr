import type { ReactNode } from "react";

export default function PageSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`page-title-${id}`}>
      <h1 className="page-title" id={`page-title-${id}`}>
        {title}
      </h1>
      {children}
    </section>
  );
}
