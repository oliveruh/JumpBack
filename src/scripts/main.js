function jumpApp() {
    return {
        birthdate: '',
        showResult: false,
        loading: false,
        magazineData: {},
        errorMessage: '',

        checkDate() {
            this.errorMessage = '';
            if (!this.birthdate) return;

            const dateParts = this.birthdate.split("-");
            if (dateParts.length === 3) {
                const year = parseInt(dateParts[0]);
                const month = parseInt(dateParts[1]);
                const day = parseInt(dateParts[2]);

                // Validate date range
                if (year < 1968) {
                    this.errorMessage = 'Weekly Shonen Jump started in 1968. Please select a later date.';
                    return;
                }

                if (year > 2020) {
                    this.errorMessage = 'Our data only goes up to 2020. Please select an earlier date.';
                    return;
                }

                const inputDate = new Date(year, month - 1, day);
                this.fetchMagazineData(inputDate);
            }
        },

        async fetchMagazineData(inputDate) {
            this.loading = true;
            this.showResult = true;

            try {
                const response = await fetch('./data/comic_vine_wsj_dataset.json');
                const data = await response.json();

                // Filter for nearest issue before the input date
                const filteredData = data
                    .filter(issue => new Date(issue.cover_date) <= inputDate)
                    .sort((a, b) => new Date(b.cover_date) - new Date(a.cover_date))[0];

                if (filteredData) {
                    // Add a slight delay for visual effect
                    setTimeout(() => {
                        this.magazineData = filteredData;
                        this.loading = false;
                    }, 1000);
                } else {
                    this.errorMessage = 'No magazine found for this date. Please try another date.';
                    this.showResult = false;
                    this.loading = false;
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                this.errorMessage = 'Failed to load magazine data. Please try again.';
                this.showResult = false;
                this.loading = false;
            }
        },

        resetForm() {
            this.showResult = false;
            this.birthdate = '';
            this.errorMessage = '';
        },

        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    };
}