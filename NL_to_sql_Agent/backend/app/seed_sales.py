from __future__ import annotations

import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.db.session import SessionLocal, init_db
from app.models import Sales


def seed_sales(n: int = 1000) -> None:
    init_db()
    db: Session = SessionLocal()
    try:
        count = db.query(Sales).count()
        if count >= n:
            print(f"Sales already has {count} rows, skip seeding.")
            return

        regions = ["东部", "西部", "南部", "北部"]
        products = ["A-Plus", "A-Standard", "B-Max", "C-Lite", "D-Pro", "E-Ultimate"]
        channels = ["线上", "线下"]

        today = date.today()
        rows: list[Sales] = []
        for i in range(n):
            days_ago = random.randint(0, 59)  # 最近 60 天
            d = today - timedelta(days=days_ago)
            rows.append(
                Sales(
                    order_date=d,
                    region=random.choice(regions),
                    product=random.choice(products),
                    channel=random.choice(channels),
                    amount=random.randint(50, 500),
                )
            )

        db.bulk_save_objects(rows)
        db.commit()
        print(f"Inserted {len(rows)} sales rows.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_sales(1000)

