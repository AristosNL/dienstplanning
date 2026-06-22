"""
Bouwt de doordeweekse dienstplanning als speciaal geval van de generieke engine
en draait een realistisch scenario: 4 weken, 3 dienst-dokters, elk een vaste
vrije dag, een cursusweek, en ongelijke beginstand in het saldo-grootboek.
"""

from datetime import date, timedelta
from roster_engine import (
    RosterEngine, Staff, Slot, Period, Avail, SoftWeights,
)

DIENST_WEEKDAG = "DIENST_WEEKDAG"
WEEKDAY_NL = ["ma", "di", "wo", "do", "vr"]


def build_weekday_slots(start: date, weeks: int) -> list[Slot]:
    slots = []
    for w in range(weeks):
        monday = start + timedelta(weeks=w)
        for i in range(5):  # ma..vr
            d = monday + timedelta(days=i)
            slots.append(Slot(
                id=f"D{d.isoformat()}",
                date=d.isoformat(),
                period=Period.FULL_DAY,
                required_skill=DIENST_WEEKDAG,
                demand=1,
                week=w,
                seq=i,
            ))
    return slots


def demo():
    start = date(2026, 6, 22)  # maandag
    weeks = 4
    slots = build_weekday_slots(start, weeks)

    doctors = [
        Staff("citgez", "Citgez", "dokter", frozenset({DIENST_WEEKDAG}), carry_in=12),
        Staff("jippes", "Jippes", "dokter", frozenset({DIENST_WEEKDAG}), carry_in=10),
        Staff("dijkst", "Dijksterhuis", "dokter", frozenset({DIENST_WEEKDAG}), carry_in=11),
    ]

    avail: dict[tuple[str, str], Avail] = {}

    def weekday_index(iso: str) -> int:
        return date.fromisoformat(iso).weekday()

    for slot in slots:
        wd = weekday_index(slot.date)
        # vaste vrije dagen
        if slot.id.startswith("D") and wd == 2:  # woensdag
            avail[("citgez", slot.date)] = Avail.MANDATORY_OFF
        if wd == 0:  # maandag
            avail[("jippes", slot.date)] = Avail.MANDATORY_OFF
        if wd == 4:  # vrijdag
            avail[("dijkst", slot.date)] = Avail.MANDATORY_OFF
        # cursusweek voor Dijksterhuis: week index 2 (de 3e week)
        if slot.week == 2:
            avail[("dijkst", slot.date)] = Avail.COURSE
        # voorkeur-vrij (zacht): Citgez liever niet op dinsdag
        if wd == 1:
            avail.setdefault(("citgez", slot.date), Avail.PREFER_OFF)

    eng = RosterEngine(doctors, slots, avail, SoftWeights(fairness=10, continuity=3, prefer_off=1))
    res = eng.solve()

    name = {s.id: s.name for s in doctors}
    print(f"status: {res.status}   feasible: {res.feasible}   objective: {res.objective}")
    print()
    # rooster per week
    by_week: dict[int, list[Slot]] = {}
    for slot in slots:
        by_week.setdefault(slot.week, []).append(slot)
    header = "week | " + " | ".join(f"{d:>13}" for d in WEEKDAY_NL)
    print(header)
    print("-" * len(header))
    for w in sorted(by_week):
        cells = []
        for slot in sorted(by_week[w], key=lambda s: s.seq):
            who = res.assignments[slot.id]
            cells.append(f"{(name[who[0]] if who else '—'):>13}")
        print(f"  {w+1}  | " + " | ".join(cells))
    print()
    print("saldo-grootboek (begin -> eind):")
    new_counts = {s.id: res.totals[s.id] - s.carry_in for s in doctors}
    for s in doctors:
        print(f"  {s.name:<14} {s.carry_in:>3} +{new_counts[s.id]:<2} = {res.totals[s.id]:>3}")
    spread = max(res.totals.values()) - min(res.totals.values())
    print(f"  spread eind: {spread}")


if __name__ == "__main__":
    demo()
