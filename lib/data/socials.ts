import type { IconType } from "react-icons";
import { FaGithub, FaInstagram, FaLinkedin } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";

export const socials: { label: string; href: string; icon: IconType }[] = [
  { label: "GitHub", href: "https://github.com/tavongachitambira", icon: FaGithub },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/tavonga-chitambira-213745309/",
    icon: FaLinkedin,
  },
  { label: "Gmail", href: "mailto:obichitas03@gmail.com", icon: MdOutlineEmail },
  { label: "Instagram", href: "https://www.instagram.com/obi_chitas03/", icon: FaInstagram },
];
