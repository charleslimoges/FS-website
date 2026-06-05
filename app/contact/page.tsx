"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Clock, CheckCircle2, User } from "lucide-react";
import Button from "@/components/ui/Button";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    interested_in_unit: false,
    unit_or_building: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">
            Get In Touch
          </p>
          <h1 className="text-4xl font-bold text-brand-navy mb-4">
            Let&apos;s find your next home
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Have a question or ready to start your search? Fill out the form below or reach out directly. We typically respond within a few hours.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Form */}
          <div>
            {success ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-3xl">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-brand-navy mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm max-w-xs">
                  Thanks for reaching out. We&apos;ll get back to you within a few hours.
                </p>
                <button
                  onClick={() => { setSuccess(false); setForm({ name: "", email: "", phone: "", message: "", interested_in_unit: false, unit_or_building: "" }); }}
                  className="mt-6 text-brand-blue text-sm font-medium hover:text-brand-navy transition-colors"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h2 className="text-xl font-semibold text-brand-navy mb-6">Send a Message</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="you@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(514) 000-0000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message *
                  </label>
                  <textarea
                    required
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={5}
                    placeholder="Tell us what you're looking for: budget, preferred neighbourhoods, move-in date, any requirements..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="interested"
                    checked={form.interested_in_unit}
                    onChange={(e) => setForm({ ...form, interested_in_unit: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                  />
                  <label htmlFor="interested" className="text-sm text-gray-600 cursor-pointer">
                    I&apos;m interested in a specific unit or building
                  </label>
                </div>

                {form.interested_in_unit && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Which unit or building?
                    </label>
                    <input
                      type="text"
                      value={form.unit_or_building}
                      onChange={(e) => setForm({ ...form, unit_or_building: e.target.value })}
                      placeholder="e.g. Unit 4B at Le Plateau, or 123 Rue Saint-Denis"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    />
                  </div>
                )}

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <Button type="submit" loading={loading} size="lg" fullWidth>
                  Send Message
                </Button>
              </form>
            )}
          </div>

          {/* Agent info */}
          <div className="space-y-8">
            {/* Agent card */}
            <div className="bg-gray-50 rounded-3xl p-8">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 bg-brand-navy rounded-2xl flex items-center justify-center shrink-0">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-brand-navy text-lg">Alex Beaumont</h3>
                  <p className="text-brand-blue text-sm font-medium">Licensed Leasing Agent</p>
                  <p className="text-gray-500 text-sm mt-1">Québec Real Estate License #12345</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mt-5 leading-relaxed">
                With 8+ years of experience in the Montreal rental market, I specialize in connecting tenants with quality apartments across the city&apos;s most sought-after neighbourhoods. My approach is personal, efficient, and always in your best interest.
              </p>
            </div>

            {/* Contact details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-brand-navy">Direct Contact</h3>
              <div className="space-y-3">
                <a href="tel:+15141234567" className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-card shrink-0">
                    <Phone className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Call or text</p>
                    <p className="font-medium text-brand-navy text-sm group-hover:text-brand-blue transition-colors">
                      (514) 123-4567
                    </p>
                  </div>
                </a>
                <a href="mailto:hello@yourkeymtl.com" className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors group">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-card shrink-0">
                    <Mail className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="font-medium text-brand-navy text-sm group-hover:text-brand-blue transition-colors">
                      hello@yourkeymtl.com
                    </p>
                  </div>
                </a>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-card shrink-0">
                    <MapPin className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Service Area</p>
                    <p className="font-medium text-brand-navy text-sm">
                      All of Greater Montreal
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-card shrink-0">
                    <Clock className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Availability</p>
                    <p className="font-medium text-brand-navy text-sm">
                      Mon–Sat, 9 AM – 6 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage map placeholder */}
            <div className="bg-gray-50 rounded-3xl overflow-hidden h-48 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Montreal Service Area</p>
                <p className="text-gray-300 text-xs mt-1">Plateau · Downtown · Mile-End · Rosemont · and more</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
