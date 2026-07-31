# Business Object Model

## Aggregate Roots

-   Partner
-   DistributionChannel
-   ProductAuthorization
-   Seller
-   IntegrationConnection
-   CommercialAgreement
-   GovernanceCase

## Supporting Objects

Organization, SellerAssignment, License, TrainingRecord,
EligibilityResult, BrandingProfile, CampaignAssignment,
DistributionTransaction, PartnerUser.

Partner là aggregate root về ngữ cảnh UX, không phải super aggregate vật
lý.
