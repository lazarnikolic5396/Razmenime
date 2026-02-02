'use client';

import Card from '@/components/ui/Card';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDF7F7]">
      {/* Red Header Section */}
      <div className="bg-[#E53935] text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="mb-6">
            <span className="text-6xl font-bold">✚</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            O Crvenom Krstu Srbije
          </h1>
          <p className="text-lg leading-relaxed">
            Već više od 140 godina, Crveni krst Srbije pomaže najugroženijim
            kategorijama stanovništva i deluje u duhu humanosti širom zemlje.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Mission */}
          <Card padding="lg">
            <div className="mb-4">
              <div className="w-12 h-12 bg-[#E53935] rounded-full flex items-center justify-center text-white text-xl mb-4">
                🎯
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#333333] mb-4">Naša Misija</h2>
            <p className="text-[#666666] leading-relaxed">
              Crveni krst Srbije organizuje i sprovodi humanitarne aktivnosti u
              skladu sa načelima Međunarodnog pokreta Crvenog krsta i Crvenog
              polumeseca, a sve u cilju pomoći najugroženijim kategorijama
              stanovništva i unapređenja kvaliteta života svih građana.
            </p>
          </Card>

          {/* Vision */}
          <Card padding="lg">
            <div className="mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl mb-4">
                ❤️
              </div>
            </div>
            <h2 className="text-2xl font-bold text-[#333333] mb-4">Naša Vizija</h2>
            <p className="text-[#666666] leading-relaxed">
              Biti prepoznata i respektovana humanitarna organizacija koja deluje u
              duhu principa humanosti, nepristrasnosti, neutralnosti, nezavisnosti,
              dobrovoljnosti, jedinstva i univerzalnosti, i koja aktivno doprinosi
              poboljšanju kvaliteta života svih građana Srbije.
            </p>
          </Card>
        </div>

        {/* Basic Principles */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center text-[#333333] mb-8">
            Osnovni Principi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Principle 1 */}
            <Card padding="md">
              <h3 className="text-xl font-semibold text-[#E53935] mb-2">
                Humanost
              </h3>
              <p className="text-[#666666] text-sm">
                Pokret nastoji sprečavati i olakšavati ljudsku patnju bez
                diskriminacije
              </p>
            </Card>

            {/* Principle 2 */}
            <Card padding="md">
              <h3 className="text-xl font-semibold text-[#E53935] mb-2">
                Nepristrasnost
              </h3>
              <p className="text-[#666666] text-sm">
                Ne pravi nikakvu razliku po osnovu nacionalnosti, rase, vere ili
                političkog uverenja
              </p>
            </Card>

            {/* Principle 3 */}
            <Card padding="md">
              <h3 className="text-xl font-semibold text-[#E53935] mb-2">
                Neutralnost
              </h3>
              <p className="text-[#666666] text-sm">
                Ne uključuje se u sukobe političke, rasne, verske ili ideološke
                prirode
              </p>
            </Card>

            {/* Principle 4 */}
            <Card padding="md">
              <h3 className="text-xl font-semibold text-[#E53935] mb-2">
                Nezavisnost
              </h3>
              <p className="text-[#666666] text-sm">
                Održava autonomiju da bi uvek mogao delovati u skladu sa
                principima pokreta
              </p>
            </Card>

            {/* Principle 5 */}
            <Card padding="md">
              <h3 className="text-xl font-semibold text-[#E53935] mb-2">
                Dobrovoljnost
              </h3>
              <p className="text-[#666666] text-sm">
                To je dobrovoljni pokret za pružanje pomoći bez želje za bilo
                kakvom dobiti
              </p>
            </Card>

            {/* Principle 6 */}
            <Card padding="md">
              <h3 className="text-xl font-semibold text-[#E53935] mb-2">
                Jedinstvo
              </h3>
              <p className="text-[#666666] text-sm">
                U svakoj zemlji može postojati samo jedno nacionalno društvo
                Crvenog krsta
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

