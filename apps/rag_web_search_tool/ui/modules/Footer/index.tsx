import {
  faGithub,
  faTwitter,
  faLinkedin,
} from "@fortawesome/free-brands-svg-icons";
import styles from "./index.module.css";
import Marquee from "./marquee";
const Footer = () => {
  const year = new Date().getFullYear();
  const currentYear = `2015 - ${year}`;
  const faFileAltIcon = faGithub; // Using github as placeholder for file-alt
  const faGithubIcon = faGithub;
  const faLinkedinIcon = faLinkedin;
  const faTwitterIcon = faTwitter;
  const faYoutubeIcon = faGithub; // Using github as placeholder for youtube
  const faInstagramIcon = faGithub; // Using github as placeholder for instagram
  const links = [
    {
      title: "Resume",
      icon: faFileAltIcon,
      url: "https://drive.google.com/file/d/1h2QH7K7153QGbW59CHWWt07Dzhgzst3a/view?usp=sharing",
    },
    {
      title: "GitHub",
      icon: faGithubIcon,
      url: "https://github.com/darianrosebrook",
    },
    {
      title: "LinkedIn",
      icon: faLinkedinIcon,
      url: "https://linkedin.com/in/darianrosebrook",
    },
    {
      title: "Twitter",
      icon: faTwitterIcon,
      url: "https://twitter.com/darianrosebrook",
    },
    {
      title: "YouTube",
      icon: faYoutubeIcon,
      url: "https://youtube.com/@darian.rosebrook",
    },
    {
      title: "Instagram",
      icon: faInstagramIcon,
      url: "https://instagram.com/darianrosebrook",
    },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.social}>
        <h2 className="light">Elsewhere</h2>
      </div>
      <ul>
        {Object.entries(links).map(([key, value]) => {
          return (
            <li key={key}>
              <Marquee {...value} />
            </li>
          );
        })}
      </ul>
      <div className={styles.copyRight}>
        <p>
          <small>&copy; {currentYear} Darian Rosebrook.</small>
        </p>
        <p>
          <small> All rights reserved.</small>
        </p>
      </div>
    </footer>
  );
};
export default Footer;
