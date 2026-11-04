"""
The offline "mock" planner: builds a sensible, category-aware plan from
templates, scaled to the person's budget, time and group size. It needs no
API key and no internet, so the app always has a working planner. English
and Hindi are both supported.
"""

import math

from ..schema import PlanRequest

# ---------------------------------------------------------------------------
# Which template a wish uses (decided from the category code / name)
# ---------------------------------------------------------------------------

GROUP_KEYWORDS = {
    "travel": ("travel", "adventure", "trip", "explore", "outdoor", "road"),
    "learn": ("learn", "educat", "career", "skill", "study", "creative", "art", "music", "book", "read"),
    "fitness": ("fit", "health", "sport", "wellness", "run", "gym", "yoga"),
}

# rough starting budget in rupees per person when none is given
BASE_BUDGET = {"travel": 25000, "learn": 8000, "fitness": 6000, "general": 10000}
STYLE_FACTOR = {"budget": 0.7, "balanced": 1.0, "comfort": 1.5}


def pick_group(request: PlanRequest) -> str:
    text = f"{request.category_code} {request.category_name}".lower()
    for group, words in GROUP_KEYWORDS.items():
        if any(word in text for word in words):
            return group
    return "general"


# ---------------------------------------------------------------------------
# Templates: (start, end) are fractions of the whole time span
# ---------------------------------------------------------------------------

TEMPLATES = {
    "travel": {
        "en": {
            "summary": "A clear plan to make \"{title}\" happen in about {duration}, {for_whom}. It covers the budget, the bookings and a step-by-step roadmap.",
            "steps": [
                (0.00, 0.10, "Pick dates and fix the budget", "Choose travel dates that suit everyone, set a firm total budget and share it with the people travelling."),
                (0.10, 0.25, "Research and shortlist", "Compare routes, places to stay and local transport. Shortlist two options and read recent reviews."),
                (0.25, 0.45, "Book the big items", "Book transport and stays first, because they take the largest share of the budget and sell out early."),
                (0.45, 0.65, "Plan the days", "Draft a day-by-day outline with must-see places, food spots and some free time."),
                (0.65, 0.85, "Paperwork and packing", "Keep ID, tickets, insurance and bookings in one folder, then pack for the weather."),
                (0.85, 1.00, "Go, enjoy and capture it", "Travel, stay flexible and take photos so you can add a memory afterwards."),
            ],
            "budget": [("Transport", 35), ("Stay", 30), ("Food", 20), ("Activities", 10), ("Emergency buffer", 5)],
            "checklist": [
                "Valid ID and documents ready",
                "Travel dates confirmed with everyone",
                "Tickets booked",
                "Stay booked",
                "Day-wise plan saved offline",
                "Emergency contacts and insurance noted",
                "Phone, power bank and charger packed",
            ],
            "tips": [
                "Book transport 4-8 weeks ahead for better prices.",
                "Keep 5-10% of the budget as a buffer for surprises.",
                "Download offline maps before you leave.",
            ],
        },
        "hi": {
            "summary": "\"{title}\" को लगभग {duration} में पूरा करने की एक साफ़ योजना, {for_whom}। इसमें बजट, बुकिंग और चरण-दर-चरण रोडमैप शामिल है।",
            "steps": [
                (0.00, 0.10, "तारीख़ें और बजट तय करें", "सबके लिए सही तारीख़ें चुनें, कुल बजट तय करें और उसे साथ जाने वालों से साझा करें।"),
                (0.10, 0.25, "जानकारी जुटाएँ और विकल्प छाँटें", "रास्ते, ठहरने की जगहें और स्थानीय साधन देखें। दो विकल्प चुनें और हाल की समीक्षाएँ पढ़ें।"),
                (0.25, 0.45, "बड़ी बुकिंग पहले करें", "यात्रा और ठहरने की बुकिंग सबसे पहले करें, क्योंकि बजट का बड़ा हिस्सा इन्हीं में जाता है और ये जल्दी भर जाते हैं।"),
                (0.45, 0.65, "दिन-दर-दिन योजना बनाएँ", "देखने लायक जगहों, खाने की जगहों और कुछ खाली समय के साथ दिन-वार रूपरेखा बनाएँ।"),
                (0.65, 0.85, "कागज़ात और पैकिंग", "पहचान-पत्र, टिकट, बीमा और बुकिंग एक ही फ़ोल्डर में रखें, फिर मौसम के हिसाब से पैकिंग करें।"),
                (0.85, 1.00, "चलें, आनंद लें और यादें सहेजें", "यात्रा करें, लचीले रहें और तस्वीरें लें, ताकि बाद में अपनी याद जोड़ सकें।"),
            ],
            "budget": [("यात्रा", 35), ("ठहरना", 30), ("खाना", 20), ("गतिविधियाँ", 10), ("आपातकालीन बफ़र", 5)],
            "checklist": [
                "वैध पहचान-पत्र और ज़रूरी कागज़ात तैयार",
                "सबके साथ तारीख़ें पक्की",
                "टिकट बुक",
                "ठहरने की जगह बुक",
                "दिन-वार योजना ऑफ़लाइन सेव",
                "आपातकालीन संपर्क और बीमा नोट किए",
                "फ़ोन, पावर बैंक और चार्जर पैक",
            ],
            "tips": [
                "बेहतर दाम के लिए यात्रा की बुकिंग 4-8 हफ़्ते पहले करें।",
                "अचानक आने वाले ख़र्चों के लिए बजट का 5-10% बफ़र रखें।",
                "निकलने से पहले ऑफ़लाइन नक्शे डाउनलोड कर लें।",
            ],
        },
    },
    "learn": {
        "en": {
            "summary": "A practical plan to learn \"{title}\" in about {duration}, {for_whom}, with a budget and a roadmap you can follow week by week.",
            "steps": [
                (0.00, 0.08, "Define a clear goal", "Write down exactly what you want to be able to do at the end and how you will check it."),
                (0.08, 0.20, "Choose your resources", "Pick one main course or book and one practice source. Too many resources slow you down."),
                (0.20, 0.60, "Learn in regular blocks", "Study in fixed slots 4-5 days a week. Short, steady sessions beat rare marathons."),
                (0.60, 0.85, "Practise with a real project", "Apply what you learnt: build, write or solve something real, and note where you get stuck."),
                (0.85, 1.00, "Test, polish and celebrate", "Take a mock test or show your work to someone, fix the gaps, then celebrate finishing."),
            ],
            "budget": [("Course / materials", 55), ("Tools and software", 15), ("Exam or certificate fee", 20), ("Buffer", 10)],
            "checklist": [
                "Goal written down with a deadline",
                "Main course or book chosen",
                "Weekly study slots blocked in the calendar",
                "Practice project picked",
                "Progress tracked every week",
                "Exam or assessment date fixed",
            ],
            "tips": [
                "Study at the same time every day to build the habit.",
                "Teach what you learn to a friend. It exposes gaps fast.",
                "Review your notes within 24 hours to remember more.",
            ],
        },
        "hi": {
            "summary": "\"{title}\" को लगभग {duration} में सीखने की एक व्यावहारिक योजना, {for_whom}। इसमें बजट और ऐसा रोडमैप है जिसे आप हफ़्ते-दर-हफ़्ते अपना सकते हैं।",
            "steps": [
                (0.00, 0.08, "साफ़ लक्ष्य तय करें", "लिखें कि अंत में आप क्या कर पाना चाहते हैं और उसे कैसे जाँचेंगे।"),
                (0.08, 0.20, "सीखने के साधन चुनें", "एक मुख्य कोर्स या किताब और एक अभ्यास का स्रोत चुनें। बहुत सारे साधन रफ़्तार धीमी कर देते हैं।"),
                (0.20, 0.60, "नियमित समय पर सीखें", "हफ़्ते में 4-5 दिन तय समय पर पढ़ें। छोटे और लगातार सत्र, कभी-कभार के लंबे सत्रों से बेहतर होते हैं।"),
                (0.60, 0.85, "असली प्रोजेक्ट से अभ्यास करें", "जो सीखा उसे लागू करें: कुछ असली बनाएँ, लिखें या हल करें, और जहाँ अटकें उसे नोट करें।"),
                (0.85, 1.00, "जाँचें, निखारें और जश्न मनाएँ", "मॉक टेस्ट दें या अपना काम किसी को दिखाएँ, कमियाँ सुधारें और पूरा होने का जश्न मनाएँ।"),
            ],
            "budget": [("कोर्स / सामग्री", 55), ("टूल्स और सॉफ़्टवेयर", 15), ("परीक्षा / प्रमाणपत्र शुल्क", 20), ("बफ़र", 10)],
            "checklist": [
                "समय-सीमा के साथ लक्ष्य लिखा",
                "मुख्य कोर्स या किताब चुनी",
                "कैलेंडर में साप्ताहिक पढ़ाई का समय तय",
                "अभ्यास प्रोजेक्ट चुना",
                "हर हफ़्ते प्रगति दर्ज",
                "परीक्षा या मूल्यांकन की तारीख़ तय",
            ],
            "tips": [
                "आदत बनाने के लिए रोज़ एक ही समय पर पढ़ें।",
                "जो सीखें उसे किसी दोस्त को सिखाएँ। इससे कमियाँ जल्दी पता चलती हैं।",
                "ज़्यादा याद रखने के लिए 24 घंटे के भीतर नोट्स दोहराएँ।",
            ],
        },
    },
    "fitness": {
        "en": {
            "summary": "A steady plan to reach \"{title}\" in about {duration}, {for_whom}, with the costs and a build-up that keeps you injury-free.",
            "steps": [
                (0.00, 0.10, "Check your starting point", "Note your current fitness, any health issues and the exact target. Talk to a doctor if needed."),
                (0.10, 0.30, "Build the base", "Start with easy sessions 3 days a week and focus on form and sleep, not speed."),
                (0.30, 0.65, "Increase gradually", "Raise intensity or distance a little every week and keep one full rest day."),
                (0.65, 0.90, "Peak and practise the target", "Rehearse the real goal (distance, routine or event) once or twice at full effort."),
                (0.90, 1.00, "Taper, recover and do it", "Ease off for a few days, eat and sleep well, then go for the goal."),
            ],
            "budget": [("Gear and clothing", 30), ("Membership / classes", 35), ("Nutrition", 25), ("Buffer", 10)],
            "checklist": [
                "Health check done (if needed)",
                "Proper shoes / gear ready",
                "Weekly schedule fixed",
                "Rest day planned",
                "Progress logged weekly",
                "Event or target date fixed",
            ],
            "tips": [
                "Increase effort by no more than about 10% a week.",
                "Sleep is part of training. Protect it.",
                "Find a buddy for accountability.",
            ],
        },
        "hi": {
            "summary": "\"{title}\" तक लगभग {duration} में पहुँचने की एक संतुलित योजना, {for_whom}। इसमें ख़र्च और चोट से बचाने वाली धीरे-धीरे बढ़ती तैयारी शामिल है।",
            "steps": [
                (0.00, 0.10, "शुरुआती स्थिति जाँचें", "अपनी मौजूदा फ़िटनेस, स्वास्थ्य संबंधी समस्याएँ और सटीक लक्ष्य लिखें। ज़रूरत हो तो डॉक्टर से सलाह लें।"),
                (0.10, 0.30, "आधार बनाएँ", "हफ़्ते में 3 दिन हल्के सत्रों से शुरू करें और रफ़्तार से ज़्यादा सही तरीके और नींद पर ध्यान दें।"),
                (0.30, 0.65, "धीरे-धीरे बढ़ाएँ", "हर हफ़्ते तीव्रता या दूरी थोड़ी बढ़ाएँ और एक पूरा दिन आराम रखें।"),
                (0.65, 0.90, "चरम तैयारी और लक्ष्य का अभ्यास", "असली लक्ष्य (दूरी, रूटीन या इवेंट) का एक-दो बार पूरे ज़ोर से अभ्यास करें।"),
                (0.90, 1.00, "हल्का करें, आराम करें और कर दिखाएँ", "कुछ दिन मेहनत घटाएँ, अच्छा खाएँ और सोएँ, फिर लक्ष्य पूरा करें।"),
            ],
            "budget": [("गियर और कपड़े", 30), ("सदस्यता / क्लास", 35), ("पोषण", 25), ("बफ़र", 10)],
            "checklist": [
                "स्वास्थ्य जाँच (ज़रूरत हो तो)",
                "सही जूते / गियर तैयार",
                "साप्ताहिक समय-सारणी तय",
                "आराम का दिन तय",
                "हर हफ़्ते प्रगति दर्ज",
                "इवेंट या लक्ष्य की तारीख़ तय",
            ],
            "tips": [
                "हर हफ़्ते मेहनत लगभग 10% से ज़्यादा न बढ़ाएँ।",
                "नींद भी ट्रेनिंग का हिस्सा है। उसे प्राथमिकता दें।",
                "जवाबदेही के लिए कोई साथी ढूँढें।",
            ],
        },
    },
    "general": {
        "en": {
            "summary": "A simple, honest plan to complete \"{title}\" in about {duration}, {for_whom}, with a rough budget and clear next steps.",
            "steps": [
                (0.00, 0.12, "Make the wish specific", "Write what done looks like, why it matters to you and a target date."),
                (0.12, 0.30, "List what you need", "Note the money, time, people and permissions needed and what is still missing."),
                (0.30, 0.55, "Take the first real step", "Do the smallest action that makes it real: a booking, a call, a sign-up or a first attempt."),
                (0.55, 0.85, "Keep the momentum", "Work on it on fixed days and review progress once a week. Adjust the plan if needed."),
                (0.85, 1.00, "Finish and record it", "Complete the wish, mark it done and add a memory so the story stays with you."),
            ],
            "budget": [("Main expenses", 60), ("Preparation", 20), ("Extras", 10), ("Buffer", 10)],
            "checklist": [
                "Clear definition written",
                "Target date set",
                "Budget decided",
                "First step scheduled",
                "Someone told about the plan (accountability)",
            ],
            "tips": [
                "Break big goals into steps you can finish in a day.",
                "Tell a friend. It makes you more likely to follow through.",
                "Done is better than perfect.",
            ],
        },
        "hi": {
            "summary": "\"{title}\" को लगभग {duration} में पूरा करने की एक सरल और ईमानदार योजना, {for_whom}। इसमें अनुमानित बजट और साफ़ अगले कदम हैं।",
            "steps": [
                (0.00, 0.12, "इच्छा को स्पष्ट बनाएँ", "लिखें कि पूरा होने का मतलब क्या है, यह आपके लिए क्यों मायने रखती है और लक्ष्य की तारीख़ क्या है।"),
                (0.12, 0.30, "ज़रूरतों की सूची बनाएँ", "पैसे, समय, लोगों और अनुमतियों की ज़रूरत लिखें और देखें कि अभी क्या कम है।"),
                (0.30, 0.55, "पहला असली कदम उठाएँ", "सबसे छोटा काम करें जो इसे असली बना दे: बुकिंग, कॉल, साइन-अप या पहली कोशिश।"),
                (0.55, 0.85, "रफ़्तार बनाए रखें", "तय दिनों पर काम करें और हफ़्ते में एक बार प्रगति देखें। ज़रूरत हो तो योजना बदलें।"),
                (0.85, 1.00, "पूरा करें और यादगार बनाएँ", "इच्छा पूरी करें, उसे पूरा चिह्नित करें और एक याद जोड़ें ताकि कहानी आपके साथ रहे।"),
            ],
            "budget": [("मुख्य ख़र्च", 60), ("तैयारी", 20), ("अतिरिक्त", 10), ("बफ़र", 10)],
            "checklist": [
                "साफ़ परिभाषा लिखी",
                "लक्ष्य की तारीख़ तय",
                "बजट तय",
                "पहला कदम तय",
                "किसी को योजना बताई (जवाबदेही के लिए)",
            ],
            "tips": [
                "बड़े लक्ष्य को ऐसे कदमों में बाँटें जो एक दिन में पूरे हो सकें।",
                "किसी दोस्त को बताएँ। इससे आप योजना पर टिके रहेंगे।",
                "बिल्कुल सही से बेहतर है पूरा किया हुआ।",
            ],
        },
    },
}

STYLE_TIPS = {
    "en": {
        "budget": "Look for off-season deals, free options and shared costs to stretch your money.",
        "comfort": "Book early to secure the more comfortable options.",
    },
    "hi": {
        "budget": "पैसे बचाने के लिए ऑफ़-सीज़न ऑफ़र, मुफ़्त विकल्प और साझा ख़र्च देखें।",
        "comfort": "आरामदायक विकल्प पक्के करने के लिए जल्दी बुकिंग करें।",
    },
}

NOTE_PREFIX = {"en": "Remember: ", "hi": "याद रखें: "}

# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------


def duration_label(days: int, lang: str) -> str:
    if days <= 14:
        return f"{days} days" if lang == "en" else f"{days} दिन"
    if days <= 120:
        weeks = max(round(days / 7), 1)
        return f"{weeks} weeks" if lang == "en" else f"{weeks} सप्ताह"
    months = max(round(days / 30), 1)
    return f"{months} months" if lang == "en" else f"{months} महीने"


def for_whom(people: int, lang: str) -> str:
    if lang == "hi":
        return "आपके लिए" if people == 1 else f"{people} लोगों के लिए"
    return "for you" if people == 1 else f"for {people} people"


def when_label(start: float, end: float, days: int, lang: str) -> str:
    """'Day 3', 'Weeks 2-3' or 'Months 1-2' for a stretch of the timeline."""
    first_day = int(start * days) + 1
    last_day = max(first_day, int(round(end * days)))

    if days <= 14:
        a, b, unit = first_day, last_day, "day"
    elif days <= 120:
        a, b, unit = (first_day - 1) // 7 + 1, (last_day - 1) // 7 + 1, "week"
    else:
        a, b, unit = (first_day - 1) // 30 + 1, (last_day - 1) // 30 + 1, "month"

    if lang == "hi":
        words = {"day": ("दिन", "दिन"), "week": ("सप्ताह", "सप्ताह"), "month": ("महीना", "महीने")}
    else:
        words = {"day": ("Day", "Days"), "week": ("Week", "Weeks"), "month": ("Month", "Months")}
    single, plural = words[unit]
    return f"{single} {a}" if a == b else f"{plural} {a}-{b}"


def difficulty_for(group: str, request: PlanRequest, total: int, estimated: bool) -> str:
    """A simple, explainable rule of thumb (not a prediction)."""
    days = request.days
    if group in ("learn", "fitness"):
        return "challenging" if days < 30 else "moderate" if days < 90 else "easy"
    if group == "travel":
        default_total = BASE_BUDGET["travel"] * request.people * STYLE_FACTOR[request.style]
        if not estimated and total < default_total * 0.6:
            return "challenging"
        return "moderate" if request.people >= 5 or days > 14 else "easy"
    return "challenging" if days < 14 else "moderate" if days < 60 else "easy"


def split_budget(total: int, shares: list[tuple[str, int]]) -> list[dict]:
    """Splits `total` by percentage; the last item takes the rounding leftover."""
    items = []
    used = 0
    for index, (label, percent) in enumerate(shares):
        if index == len(shares) - 1:
            amount = max(total - used, 0)
        else:
            amount = int(round(total * percent / 100 / 10) * 10)
            used += amount
        items.append({"label": label, "amount": amount})
    return items


# ---------------------------------------------------------------------------
# The provider entry point
# ---------------------------------------------------------------------------


def generate(request: PlanRequest) -> dict:
    lang = request.language if request.language in ("en", "hi") else "en"
    group = pick_group(request)
    template = TEMPLATES[group][lang]

    estimated = request.budget is None
    if estimated:
        total = int(
            BASE_BUDGET[group] * request.people * STYLE_FACTOR.get(request.style, 1.0)
        )
        total = int(math.ceil(total / 100.0) * 100)
    else:
        total = int(request.budget)

    duration = duration_label(request.days, lang)
    timeline = [
        {
            "when": when_label(start, end, request.days, lang),
            "title": title,
            "detail": detail,
        }
        for start, end, title, detail in template["steps"]
    ]

    checklist = list(template["checklist"])
    if request.notes.strip():
        checklist.append(f"{NOTE_PREFIX[lang]}{request.notes.strip()[:80]}")

    tips = list(template["tips"])
    style_tip = STYLE_TIPS[lang].get(request.style)
    if style_tip:
        tips.append(style_tip)

    return {
        "summary": template["summary"].format(
            title=request.title,
            duration=duration,
            for_whom=for_whom(request.people, lang),
        ),
        "difficulty": difficulty_for(group, request, total, estimated),
        "duration_label": duration,
        "estimated_total": total,
        "budget_is_estimate": estimated,
        "budget": split_budget(total, template["budget"]),
        "timeline": timeline,
        "checklist": checklist,
        "tips": tips,
    }