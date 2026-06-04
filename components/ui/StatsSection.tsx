import { Building2, Users, Award, Home } from "lucide-react";

const stats = [
  { icon: Home, value: "150+", label: "Units Available" },
  { icon: Users, value: "500+", label: "Happy Tenants" },
  { icon: Building2, value: "25+", label: "Buildings" },
  { icon: Award, value: "8+", label: "Years of Experience" },
];

export default function StatsSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-3xl p-6 text-center shadow-card"
              >
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-brand-blue" />
                </div>
                <div className="text-3xl font-bold text-brand-navy mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
