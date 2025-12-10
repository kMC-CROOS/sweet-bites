import { HeartIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold mb-4">SweetBite Bakery</h3>
            <p className="text-gray-300 mb-4">
              Creating delicious memories with every bite. We specialize in custom cakes,
              pastries, and baked goods made with love and the finest ingredients.
            </p>
            <div className="flex items-center text-gray-300">
              <HeartIcon className="h-5 w-5 mr-2 text-red-500" />
              <span>Made with love in every recipe</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-white transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-gray-300 hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/profile" className="text-gray-300 hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
              <li>
                <Link to="/feedback" className="text-gray-300 hover:text-white transition-colors">
                  Feedback
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:manomega@gmail.com"
                  className="text-gray-300 hover:text-white transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                  manomega@gmail.com
                </a>
              </li>
              <li>
                <div className="bg-black text-white p-3 rounded-lg mt-3">
                  <div className="text-sm text-gray-300 mb-1">Call us or WhatsApp:</div>
                  <a
                    href="tel:+94758549382"
                    className="text-white font-semibold text-lg hover:text-green-400 transition-colors flex items-center"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                    </svg>
                    +94 75 854 9382
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Contact Us Section */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold mb-4">Get in Touch</h3>
            <p className="text-gray-300 mb-6">Ready to order your perfect cake? Contact us today!</p>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6">
              {/* Facebook Link */}
              <a
                href="https://www.facebook.com/profile.php?id=61575974396933"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center"
              >
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Visit Our Facebook Page
              </a>

              {/* Instagram Link */}
              <div className="bg-black text-white p-6 rounded-lg border-2 border-gray-600">
                <div className="text-sm text-gray-300 mb-2">Follow us on Instagram:</div>
                <a
                  href="https://www.instagram.com/meha_bakes/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white font-bold text-2xl hover:text-pink-400 transition-colors flex items-center justify-center"
                >
                  <svg className="w-8 h-8 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.297-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.807.875 1.297 2.026 1.297 3.323s-.49 2.448-1.297 3.323c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.281H7.721c-.49 0-.875.385-.875.875v8.449c0 .49.385.875.875.875h8.449c.49 0 .875-.385.875-.875V8.582c0-.49-.385-.875-.875-.875z" />
                  </svg>
                  @meha_bakes
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2024 SweetBite Bakery. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-gray-300 text-sm">
                Privacy Policy
              </span>
              <span className="text-gray-300 text-sm">
                Terms of Service
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
