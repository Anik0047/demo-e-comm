import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { FaCcMastercard, FaCcVisa, FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube } from "react-icons/fa6";
import { NewsletterForm } from "@/components/layout/footer/newsletter-form";
import { Logo } from "@/components/shared/logo";
import { getFooterData } from "@/services/footer";

const contactIcons = { phone: Phone, mail: Mail, mapPin: MapPin, clock: Clock };
const socialIcons = { facebook: FaFacebookF, instagram: FaInstagram, youtube: FaYoutube, linkedin: FaLinkedinIn };
const cardIcons = { visa: FaCcVisa, mastercard: FaCcMastercard };

export async function Footer() {
  const data = await getFooterData();

  return (
    <footer className="mt-8 border-t border-line bg-soft font-body md:mt-12">
      <div className="mx-auto max-w-[1280px] px-4">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 py-10 md:grid-cols-4 md:py-12 lg:grid-cols-12">
          <div className="col-span-2 min-w-0 md:col-span-4 lg:col-span-4">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-mute">{data.description}</p>
            <ul className="mt-5 space-y-2 text-sm text-mute">
              {data.contacts.map((contact) => {
                const Icon = contactIcons[contact.icon];
                return <li key={contact.icon} className="flex min-w-0 items-start gap-2"><Icon className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" /><span className="min-w-0 wrap-break-word">{contact.text}</span></li>;
              })}
            </ul>
            <NewsletterForm content={data.newsletter} />
            <div className="mt-6 flex gap-2">
              {data.socials.map((social) => {
                const Icon = socialIcons[social.icon];
                return <a key={social.icon} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="grid size-11 place-items-center rounded-full border border-line bg-canvas text-ink transition-colors duration-150 hover:border-brand hover:bg-brand hover:text-white"><Icon className="size-4" aria-hidden="true" /></a>;
              })}
            </div>
          </div>
          <nav aria-label="Footer" className="contents">
            {data.linkGroups.map((group) => (
              <div key={group.title} className="col-span-1 min-w-0 lg:col-span-2">
                <h3 className="mb-2 font-head text-sm font-bold text-ink">{group.title}</h3>
                <ul>
                  {group.links.map((link) => <li key={link.label}><a href={link.href} className="inline-block min-h-11 py-2.5 text-sm text-mute hover:text-brand-strong hover:underline">{link.label}</a></li>)}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-line py-5">
          <span className="text-xs text-mute">{data.paymentLabel}</span>
          <ul className="flex min-w-0 flex-wrap items-center gap-2">
            {data.paymentChips.map((label) => <li key={label} className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-bold text-ink">{label}</li>)}
            {data.paymentCards.map((card) => {
              const Icon = cardIcons[card.icon];
              return <li key={card.icon} className="text-ink"><span className="sr-only">{card.label}</span><Icon className="h-7 w-9" aria-hidden="true" /></li>;
            })}
          </ul>
        </div>
        <div className="flex flex-col gap-3 border-t border-line py-5 text-xs text-mute md:flex-row md:items-center md:justify-between">
          <p className="min-w-0">{data.copyright}</p>
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            {data.bottomLinks.map((link) => <a key={link.label} href={link.href} className="inline-flex min-h-11 min-w-11 items-center py-3 hover:text-brand-strong hover:underline">{link.label}</a>)}
            <span>{data.locale}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
