import type { ComponentProps, ReactNode } from "react";

type LinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: string;
  children?: ReactNode;
};

/** Renders as `<a>` so RTL can assert href without Next.js runtime. */
export default function NextLinkMock({
  href,
  children,
  ...rest
}: LinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
