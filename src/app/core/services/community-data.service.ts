import { Injectable } from '@angular/core';
import { Announcement, CommunityEvent, CommunityProfile, Gotra } from '../models/community.models';

@Injectable({ providedIn: 'root' })
export class CommunityDataService {
  private readonly gotraLineages: Omit<Gotra, 'members'>[] = [
    { name: 'अग्रावत', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'अनन्तानन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'अनुभवानन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'अलखानन्दी', tradition: 'सम्प्रदाय की पुष्टि बाकी', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'कर्मचन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'कालू जी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'कीलावत', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'कुबावत', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'खोजी जी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'जंगीजी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'लाहारामी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'टीलावत', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'तनतुलसी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'दिवाकर', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'देवमुरारी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'धूंध्यानन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'नरहर्यानन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'नाभाजी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'पीपावत', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'पूर्ण बैराठी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'भगवन्ननारायणी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'भड़गी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'भावानन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'मलूकिया', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'योगानन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'रामकबीर', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'राघवचेतनी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'रामथंमणा', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'रामरामायणी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'रामरावली', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'रामरंगी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'लालतुरंगी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'सुखानन्दी', tradition: 'रामावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'सुरसुरानन्दी', tradition: 'सम्प्रदाय की पुष्टि बाकी', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'हठीनारायणी', tradition: 'सम्प्रदाय की पुष्टि बाकी', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'हनुमानी', tradition: 'सम्प्रदाय की पुष्टि बाकी', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'केशवव्याणी', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'घमंडी', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'चित्रानागा', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'चर्तुभुजी', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'तत्ववेदी', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'परशुरामी', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'मधवकाणी', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'राधावल्लभी', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'लपरागोपाली', tradition: 'निमावत सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'वीरमत्यागी', tradition: 'सम्प्रदाय की पुष्टि बाकी', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'शोभावत', tradition: 'सम्प्रदाय की पुष्टि बाकी', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'ऋषिकेशवी', tradition: 'सम्प्रदाय की पुष्टि बाकी', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'गोकुलानन्दी', tradition: 'विष्णुस्वामी सम्प्रदाय', description: 'आपकी साझा की गई विष्णुस्वामी सम्प्रदाय की गोत्र सूची में शामिल।' },
    { name: 'विट्ठलानन्दी', tradition: 'विष्णुस्वामी सम्प्रदाय', description: 'आपकी साझा की गई विष्णुस्वामी सम्प्रदाय की गोत्र सूची में शामिल।' },
    { name: 'नित्यानन्दी', tradition: 'माध्व/गौड़ीय सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' },
    { name: 'श्यामानन्दी', tradition: 'माध्व/गौड़ीय सम्प्रदाय', description: 'आपके द्वारा साझा की गई 52 गोत्रों की सूची में शामिल।' }
  ];

  get gotras(): Gotra[] {
    return this.gotraLineages.map(gotra => ({
      ...gotra,
      members: this.profiles.filter(profile => profile.gotra === gotra.name).length
    }));
  }

  readonly profiles: CommunityProfile[] = [
    { id: 'aarav-shah', name: 'Aarav Shah', gender: 'Man', age: 29, city: 'Ahmedabad', gotra: 'अग्रावत', education: 'MBA, Finance', profession: 'Investment Analyst', introduction: 'Grounded in family values and curious about the world. I enjoy heritage walks, good books and bringing people together.', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=720&q=85', verified: true, active: true, family: 'A close-knit family of four. Our family values kindness, education and staying connected to our roots.', lifestyle: 'Vegetarian · Non-smoker · Enjoys travel, reading and community volunteering' },
    { id: 'meera-patel', name: 'Meera Patel', gender: 'Woman', age: 27, city: 'Vadodara', gotra: 'अनन्तानन्दी', education: 'M.Des, Communication', profession: 'Product Designer', introduction: 'A creative at heart who finds joy in design, classical music and the little rituals that make a home.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=85', verified: true, active: true, family: 'A warm and supportive family of four with a deep appreciation for education and culture.', lifestyle: 'Vegetarian · Enjoys music, design, cooking and weekend getaways' },
    { id: 'dev-parekh', name: 'Dev Parekh', gender: 'Man', age: 31, city: 'Mumbai', gotra: 'ऋषिकेशवी', education: 'B.Tech, Computer Science', profession: 'Technology Consultant', introduction: 'Easy-going, family-oriented and happiest exploring new places, watching cricket or helping at community events.', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=720&q=85', verified: true, active: false, family: 'A progressive family of five who value close relationships, honesty and mutual respect.', lifestyle: 'Vegetarian · Non-smoker · Cricket, trekking and food trails' },
    { id: 'isha-joshi', name: 'Isha Joshi', gender: 'Woman', age: 26, city: 'Surat', gotra: 'कर्मचन्दी', education: 'MBBS', profession: 'Doctor', introduction: 'A compassionate doctor who loves garba, spending time with family and finding new recipes to share.', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=720&q=85', verified: true, active: true, family: 'A caring family of five. Our home is always open to friends and extended family.', lifestyle: 'Vegetarian · Loves garba, cooking and long conversations' },
    { id: 'krish-desai', name: 'Krish Desai', gender: 'Man', age: 28, city: 'Pune', gotra: 'कालू जी', education: 'CA, ICAI', profession: 'Chartered Accountant', introduction: 'An optimistic professional who balances work with volunteering, weekend cycling and time with loved ones.', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=720&q=85', verified: false, active: true, family: 'A warm family of four that values tradition, independence and spending time together.', lifestyle: 'Vegetarian · Cycling, volunteering and travel' },
    { id: 'riya-trivedi', name: 'Riya Trivedi', gender: 'Woman', age: 28, city: 'Ahmedabad', gotra: 'कीलावत', education: 'M.A., Psychology', profession: 'Counselling Psychologist', introduction: 'Thoughtful, cheerful and a good listener. I love theatre, mindful living and making time for family.', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=720&q=85', verified: true, active: true, family: 'A close family of four who believe in kindness, open conversations and shared traditions.', lifestyle: 'Vegetarian · Theatre, yoga and exploring local cafés' },
    { id: 'nishant-shah', name: 'Nishant Shah', gender: 'Man', age: 32, city: 'Vadodara', gotra: 'शोभावत', education: 'B.E., Mechanical', profession: 'Entrepreneur', introduction: 'Building a family business with purpose. Outside work, you will find me at a cricket match or on a nature trail.', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=720&q=85', verified: true, active: false, family: 'A business-minded but close family of five, deeply involved in local community life.', lifestyle: 'Vegetarian · Cricket, nature walks and family gatherings' },
    { id: 'kavya-mehta', name: 'Kavya Mehta', gender: 'Woman', age: 25, city: 'Mumbai', gotra: 'खोजी जी', education: 'M.Com', profession: 'Marketing Manager', introduction: 'Lively, curious and rooted. I love learning about our traditions and making celebrations memorable.', image: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=720&q=85', verified: true, active: true, family: 'A loving family of four that enjoys celebrating festivals and making time for one another.', lifestyle: 'Vegetarian · Dance, travel and festive cooking' },
    { id: 'raj-modi', name: 'Raj Modi', gender: 'Man', age: 30, city: 'Surat', gotra: 'वीरमत्यागी', education: 'M.Tech, Data Science', profession: 'Data Scientist', introduction: 'An analytical mind with a creative side. I enjoy badminton, photography and discovering local history.', image: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=720&q=85', verified: false, active: true, family: 'A supportive family of four that encourages curiosity and values togetherness.', lifestyle: 'Vegetarian · Badminton, photography and heritage walks' }
  ];

  readonly events: CommunityEvent[] = [
    { title: 'Sharad Purnima Samaj Milan', date: '18 October 2026', venue: 'Vaishnav Community Hall, Ahmedabad', category: 'Community gathering', description: 'An evening of devotion, music and togetherness for families across our community.', image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=85' },
    { title: 'Yuva Connect: Ideas & Impact', date: '25 October 2026', venue: 'Riverfront Centre, Ahmedabad', category: 'Youth', description: 'A welcoming space for young members to share ideas, build friendships and shape community projects.', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1000&q=85' },
    { title: 'Diwali Sneh Milan', date: '7 November 2026', venue: 'Shree Vaishnav Samaj Bhavan, Vadodara', category: 'Festival', description: 'Celebrate the festival of lights with family, traditional performances and a community meal.', image: 'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=1000&q=85' }
  ];

  readonly announcements: Announcement[] = [
    { title: 'Diwali Sneh Milan registrations are open', date: '1 October 2026', category: 'Events', summary: 'Join families from across the Samaj for an evening of celebration, performances and community fellowship.' },
    { title: 'Scholarship applications for 2026–27', date: '24 September 2026', category: 'Education', summary: 'Applications are invited from eligible students. Please contact the Samaj office for guidelines and dates.' },
    { title: 'Updated Samaj office hours', date: '12 September 2026', category: 'Notice', summary: 'The office will be open Monday to Saturday, 10:00 AM–6:00 PM. We look forward to hearing from you.' }
  ];
}
