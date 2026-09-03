import { motion } from "motion/react";
import { Link } from "react-router-dom";
import img from "../assets/logo.png";

const Footer = () => {
  const quickLinks = [
    { label: "Terms of Service", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Contact Us", to: "/contact" },
    { label: "About Us", to: "/about" },
    { label: "Notes", to: "/notes" },
    { label: "History", to: "/history" },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="z-10 mx-6 mb-6 mt-24 rounded-2xl border border-white/10 bg-gray-900 px-8 py-12 text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
    >
      <motion.div
        whileHover={{ rotateX: 3, rotateY: -3 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex max-w-6xl flex-col"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          
          {/* Brand */}
          <div className="max-w-md">
            <div className="mb-4 flex items-center gap-3">
              <img
                src={img}
                alt="ExaminAI Logo"
                className="h-11 w-11 rounded-xl border border-white/10 object-cover shadow-lg"
              />

              <h2 className="text-2xl font-bold tracking-tight">
                ExaminAI
              </h2>
            </div>

            <p className="text-sm leading-6 text-gray-400">
              Your AI-powered exam companion. Simplifying your exam
              preparation with intelligent insights and personalized
              recommendations.
            </p>
          </div>

          {/* Quick Links */}
          <nav aria-label="Footer">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-300">
              Quick Links
            </h3>

            <ul className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-gray-400 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <div className="my-8 h-px w-full bg-white/10" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} ExaminAI. All rights reserved.
          </p>

          <p className="text-sm text-gray-500">
            Built with  ❤️ &amp; AI for smarter exam preparation.
          </p>
        </div>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;
